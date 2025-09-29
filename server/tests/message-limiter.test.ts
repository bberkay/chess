import { createServer } from "src/BunServer";
import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { type Server } from "bun";
import { waitForWebSocketSettle } from "./utils";
import { TEST_BOARD } from "./consts";
import { MockClient } from "./helpers/MockClient";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { WsErrorData, WsTitle, pruneIPMessages } from "@WebSocket";

// Check message limiter
const isMessageLimiterOff = Number(Bun.env.ENABLE_MESSAGE_LIMIT) === 0;
if (isMessageLimiterOff) {
    console.error(
        "Consider enabling `ENABLE_MESSAGE_LIMIT` from .env.test to run message limiting tests."
    );
}

// Create timeouts
const TIMEOUT = 60_000; // milliseconds

// Create message counts
const MESSAGE_LIMIT = Number(Bun.env.MESSAGE_LIMIT)
const WS_MESSAGE_COUNT = MESSAGE_LIMIT * 1.5;
const MAX_RCMNDD_MESSAGE_LIMIT_FOR_TESTING = 50;
console.log("MESSAGE_LIMIT from .env.test: ", Bun.env.MESSAGE_LIMIT);
if (MESSAGE_LIMIT > MAX_RCMNDD_MESSAGE_LIMIT_FOR_TESTING) {
    console.warn(
        `Consider reducing "MESSAGE_LIMIT" below ${MAX_RCMNDD_MESSAGE_LIMIT_FOR_TESTING} from .env.test for faster tests.`
    );
}

// Create windows
const MESSAGE_WINDOW_MS = Number(Bun.env.MESSAGE_WINDOW_MS);
const MAX_RCMNDD_WINDOW_MS_FOR_TESTING = 5000;
console.log("MESSAGE_WINDOW_MS from .env.test: ", MESSAGE_WINDOW_MS);
if (MESSAGE_WINDOW_MS > MAX_RCMNDD_WINDOW_MS_FOR_TESTING) {
    console.warn(
        `Consider reducing "MESSAGE_WINDOW_MS" below ${MAX_RCMNDD_WINDOW_MS_FOR_TESTING} from .env.test for faster tests.`
    );
}

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

const parseRetryAfterFromMessage = (message: string) => {
    const match = message.toLowerCase().match(/retry-after=(\d+)/);
    const retryAfter = match ? parseInt(match[1], 10) : null;
    return retryAfter;
}

const getRetryAfterHeaderFromMessages = (responses: WsErrorData[]) => {
    return parseRetryAfterFromMessage(responses[responses.length - 1].message)
}

const howManyWSMessagesPassedMessageLimiter = (responses: WsErrorData[]): number => {
    return responses.map(r => {
        return !parseRetryAfterFromMessage(r.message)
    }).filter(Boolean).length;
}

const createCreatorAndGuestClients = async (): Promise<[MockCreator, MockClient]> => {
    const creatorClient = new MockCreator(serverUrl, webSocketUrl);
    const { lobbyId } = (await creatorClient.createLobby({ ...TEST_BOARD, name: "alex" })).data!;

    const guestClient = new MockGuest(serverUrl, webSocketUrl);
    await guestClient.connectLobby({ name: "john", lobbyId });

    return [creatorClient, guestClient];
}

beforeEach(async () => {
    server = createServer();
    pruneIPMessages(true);
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

describe.skipIf(isMessageLimiterOff)("Message Limiting", () => {
    test("Should limit rapid WS messages within a time window", async () => {
        console.log("Sending initial batch of WS messages...");

        const [creatorClient] = await createCreatorAndGuestClients();

        const results = [];
        for (let i = 0; i < WS_MESSAGE_COUNT; i++) {
            try {
                // @ts-expect-error Just a simple string enough for testing
                creatorClient.send("spam");
                // If we pull WsTitle.Error when we hit message limit,
                // the pulled message should be something like this:
                // "Rate limit exceeded. Retry-After=${MESSAGE_WINDOW_MS}ms, Limit=${MESSAGE_LIMIT}, Remaining=0`"
                // otherwise, if we pull WsTitle.Error without hitting message limit
                // the pulled message should be something like this (which confirms that
                // we passed message limiter because checking message format comes right
                // after message limiter check):
                // "Message must be an array in the format: [WsTitle, WsDataMap[WsTitle]?]."
                const result = await creatorClient.pull(WsTitle.Error);
                results.push(result);
            } catch (e: unknown) {
                if (creatorClient.ws?.readyState === WebSocket.CLOSED)
                    break;
                throw e;
            }
        }

        const successCount = howManyWSMessagesPassedMessageLimiter(results);

        console.log("Success count:", successCount);
        expect(successCount).toBeLessThanOrEqual(MESSAGE_LIMIT);
        expect(successCount).toBeGreaterThan(0);
    }, TIMEOUT);

    test("Should reset message limiting after retry-after period passes", async () => {
        console.log("Sending initial batch of WS messages...");

        const [preMsgLimitBannedClient] = await createCreatorAndGuestClients();
        const preMsgResults = [];
        for (let i = 0; i < WS_MESSAGE_COUNT; i++) {
            try {
                // @ts-expect-error Same as above
                preMsgLimitBannedClient.send("spam");
                const result = await preMsgLimitBannedClient.pull(WsTitle.Error);
                preMsgResults.push(result);
            } catch (e: unknown) {
                if (preMsgLimitBannedClient.ws?.readyState === WebSocket.CLOSED)
                    break;
                throw e;
            }
        }

        const preMsgSuccessCount = howManyWSMessagesPassedMessageLimiter(preMsgResults);

        console.log("Initial success count:", preMsgSuccessCount);
        expect(preMsgSuccessCount).toBeLessThanOrEqual(MESSAGE_LIMIT);
        expect(preMsgSuccessCount).toBeGreaterThan(0);

        const retryAfter = getRetryAfterHeaderFromMessages(preMsgResults);
        expect(retryAfter).toBeTruthy()

        console.log("Waiting for Retry-After duration...");
        await waitForWebSocketSettle(Number(retryAfter));

        console.log("Sending messages AFTER waiting for Retry-After...");
        const [postMsgLimitBannedClient] = await createCreatorAndGuestClients();
        const postMsgResults = [];
        for (let i = 0; i < WS_MESSAGE_COUNT; i++) {
            try {
                // @ts-expect-error Same as above
                postMsgLimitBannedClient.send("spam");
                const result = await postMsgLimitBannedClient.pull(WsTitle.Error);
                postMsgResults.push(result);
            } catch (e: unknown) {
                if (postMsgLimitBannedClient.ws?.readyState === WebSocket.CLOSED)
                    break;
                throw e;
            }
        }

        const postMsgSuccessCount = howManyWSMessagesPassedMessageLimiter(postMsgResults);

        console.log("Success count after waiting:", postMsgSuccessCount);
        expect(postMsgSuccessCount).toBeLessThanOrEqual(MESSAGE_LIMIT);
        expect(postMsgSuccessCount).toBeGreaterThan(0);
    }, TIMEOUT);

    test("Should enforce retry-after header and block messages before waiting period ends", async () => {
        console.log("Sending initial batch of WS messages...");

        const [preMsgLimitBannedClient] = await createCreatorAndGuestClients();
        const preMsgResults = [];
        for (let i = 0; i < WS_MESSAGE_COUNT; i++) {
            try {
                // @ts-expect-error Same as above
                preMsgLimitBannedClient.send("spam");
                const result = await preMsgLimitBannedClient.pull(WsTitle.Error);
                preMsgResults.push(result);
            } catch (e: unknown) {
                if (preMsgLimitBannedClient.ws?.readyState === WebSocket.CLOSED)
                    break;
                throw e;
            }
        }

        const preMsgSuccessCount = howManyWSMessagesPassedMessageLimiter(preMsgResults);

        console.log("Initial success count:", preMsgSuccessCount);
        expect(preMsgSuccessCount).toBeLessThanOrEqual(MESSAGE_LIMIT);
        expect(preMsgSuccessCount).toBeGreaterThan(0);

        const retryAfter = getRetryAfterHeaderFromMessages(preMsgResults);
        expect(retryAfter).toBeTruthy()

        console.log("Sending requests BEFORE waiting for Retry-After...");
        const [postMsgLimitBannedClient] = await createCreatorAndGuestClients();
        const postMsgResults = [];
        for (let i = 0; i < WS_MESSAGE_COUNT; i++) {
            try {
                // @ts-expect-error Same as above
                postMsgLimitBannedClient.send("spam");
                const result = await postMsgLimitBannedClient.pull(WsTitle.Error);
                postMsgResults.push(result);
            } catch (e: unknown) {
                if (postMsgLimitBannedClient.ws?.readyState === WebSocket.CLOSED)
                    break;
                throw e;
            }
        }

        const postMsgSuccessCount = howManyWSMessagesPassedMessageLimiter(postMsgResults);
        console.log("Success count before waiting:", postMsgSuccessCount);
        expect(postMsgSuccessCount).toBe(0);
    }, TIMEOUT);
});

afterEach(() => {
    server?.stop(true);
});
