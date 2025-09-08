import { createServer } from "src/BunServer";
import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { type Server } from "bun";
import { pruneIPRequests, HTTPRoutes, HTTPResponseData } from "src/HTTP";
import { createWsLobbyConnUrl, testFetch, waitForWebSocketSettle } from "./utils";
import { TEST_BOARD } from "./consts";

// Check rate and message limiter
const isRateLimiterOff = Number(Bun.env.ENABLE_RATE_LIMIT) === 0;
if (isRateLimiterOff) {
    throw new Error(
        "Consider enabling `ENABLE_RATE_LIMIT` from .env.test to run rate limiting tests."
    );
}

// Create timeouts
const WS_CONN_TIMEOUT = 10000;
const MAX_TIME_PER_HTTP_REQUEST = 100; // milliseconds
const MAX_TIME_PER_WS_REQUEST = 100; // milliseconds

// Create request counts
const RATE_LIMIT = Number(Bun.env.RATE_LIMIT);
const HTTP_REQUEST_COUNT = RATE_LIMIT * 1.5;
const WS_REQUEST_COUNT = RATE_LIMIT * 1.5;
const MAX_RCMNDD_REQUEST_COUNT_FOR_TESTING = 50;
console.log(".RATE_LIMIT from .env.test: ", RATE_LIMIT);
if (RATE_LIMIT > MAX_RCMNDD_REQUEST_COUNT_FOR_TESTING) {
    throw new Error(
        `Consider reducing "RATE_LIMIT" below ${MAX_RCMNDD_REQUEST_COUNT_FOR_TESTING} from .env.test for faster tests.`
    );
}

// Create windows
const RATE_WINDOW_MS = Number(Bun.env.RATE_WINDOW_MS);
const SAFETY_MARGIN = 2;
const MAX_RCMNDD_WINDOW_MS_FOR_TESTING = 5000;
console.log(".RATE_WINDOW_MS from .env.test: ", RATE_WINDOW_MS);
if (RATE_WINDOW_MS > MAX_RCMNDD_WINDOW_MS_FOR_TESTING) {
    throw new Error(
        `Consider reducing "RATE_WINDOW_MS" below ${MAX_RCMNDD_WINDOW_MS_FOR_TESTING} from .env.test for faster tests.`
    );
}

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

const createTestLobby = async (): Promise<HTTPResponseData[HTTPRoutes.CreateLobby]> => {
    const createLobbyResponse = await testFetch(
        serverUrl,
        HTTPRoutes.CreateLobby,
        {
            name: "web socket spammer",
            ...TEST_BOARD
        }
    );
    const lobbyId = createLobbyResponse.data!.lobbyId;
    const player = createLobbyResponse.data!.player;
    return { lobbyId, player };
}

const makeHTTPRequest = async () => {
    const response = await fetch(
        serverUrl + HTTPRoutes.CheckLobby.replace("/", "").replace(":lobbyId", "123123"),
        { method: "GET" },
    );
    return response;
};

const makeWSRequest = async (wsUrl: string) => {
    return await new Promise<string | false>((resolve) => {
        const ws = new WebSocket(wsUrl);
        ws.onmessage = (event: MessageEvent) => resolve(event.data);
        ws.onclose = () => resolve(false);
        ws.onerror = () => resolve(false);
        setTimeout(() => resolve(false), WS_CONN_TIMEOUT);
    });
};

const getRetryAfterHeaderFromResponse = (response: PromiseSettledResult<Response>) => {
    return response.status === "fulfilled" && (response.value.headers.get("Retry-After") || response.value.headers.get("retry-after"));
}

const getRetryAfterHeaderFromResponses = (responses: PromiseSettledResult<Response>[]) => {
    for(const r of responses) {
        const retryAfter = getRetryAfterHeaderFromResponse(r);
        if (retryAfter) return retryAfter;
    }
    return null;
}

const parseRetryAfterFromMessage = (message: string) => {
    const match = message.match(/retry-after=(\d+)/);
    const retryAfter = match ? parseInt(match[1], 10) : null;
    return retryAfter;
}

const getRetryAfterHeaderFromMessage = (response: PromiseSettledResult<string | false>) => {
    if (response.status !== "fulfilled" || !response.value) return false;
    return parseRetryAfterFromMessage(response.value);
}

const howManyHTTPRequestsPassedRateLimiter = (responses: PromiseSettledResult<Response>[]): number => {
    return responses.map(r => {
        return !getRetryAfterHeaderFromResponse(r);
    }).filter(Boolean).length;
}

const howManyWSRequestsPassedRateLimiter = (responses: PromiseSettledResult<string | false>[]): number => {
    return responses.map(r => {
        return !getRetryAfterHeaderFromMessage(r);
    }).filter(Boolean).length;
}

beforeEach(async () => {
    server = createServer();
    pruneIPRequests(true);
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

describe.skipIf(isRateLimiterOff)("Rate Limiter", () => {
    test("Should limit rapid HTTP requests within a time window", async () => {
        console.log("Generating rapid HTTP requests...");
        const rapidRequests = Array.from({ length: HTTP_REQUEST_COUNT }, () =>
            makeHTTPRequest()
        );

        const results = await Promise.allSettled(rapidRequests);
        const successCount = howManyHTTPRequestsPassedRateLimiter(results);

        console.log("Success count:", successCount);
        expect(successCount).toBeLessThanOrEqual(HTTP_REQUEST_COUNT);
        expect(successCount).toBeGreaterThan(0);
    }, (MAX_TIME_PER_HTTP_REQUEST * HTTP_REQUEST_COUNT) * SAFETY_MARGIN);

    test("Should reset rate limiting after retry-after period passes", async () => {
        console.log("Sending initial batch of requests...");
        const rapidRequests = Array.from({ length: HTTP_REQUEST_COUNT }, () =>
            makeHTTPRequest()
        );

        const results = await Promise.allSettled(rapidRequests);
        const successCount = howManyHTTPRequestsPassedRateLimiter(results);

        console.log("Initial success count:", successCount);
        expect(successCount).toBeLessThanOrEqual(HTTP_REQUEST_COUNT);
        expect(successCount).toBeGreaterThan(0);

        const retryAfter = getRetryAfterHeaderFromResponses(results);
        expect(retryAfter).toBeTruthy();

        console.log("Waiting for Retry-After duration...");
        await waitForWebSocketSettle(Number(retryAfter));

        console.log("Sending requests AFTER waiting for Retry-After...");
        const postWaitRequests = Array.from({ length: HTTP_REQUEST_COUNT }, () =>
            makeHTTPRequest()
        );

        const postWaitResults = await Promise.allSettled(postWaitRequests);
        const postWaitSuccessCount = howManyHTTPRequestsPassedRateLimiter(postWaitResults);

        console.log("Success count after waiting:", postWaitSuccessCount);
        expect(postWaitSuccessCount).toBeLessThanOrEqual(HTTP_REQUEST_COUNT);
        expect(postWaitSuccessCount).toBeGreaterThan(0);
    }, (MAX_TIME_PER_HTTP_REQUEST * (HTTP_REQUEST_COUNT * 2)) * SAFETY_MARGIN);

    test("Should enforce retry-after header and block requests before waiting period ends", async () => {
        console.log("Sending initial batch of requests...");
        const rapidRequests = Array.from({ length: HTTP_REQUEST_COUNT }, () =>
            makeHTTPRequest()
        );

        const results = await Promise.allSettled(rapidRequests);
        const successCount = howManyHTTPRequestsPassedRateLimiter(results);

        console.log("Initial success count:", successCount);
        expect(successCount).toBeLessThanOrEqual(HTTP_REQUEST_COUNT);
        expect(successCount).toBeGreaterThan(0);

        const retryAfter = getRetryAfterHeaderFromResponses(results);
        expect(retryAfter).toBeTruthy();

        console.log("Sending requests BEFORE waiting for Retry-After...");
        const preWaitRequests = Array.from({ length: HTTP_REQUEST_COUNT / 2 }, () =>
            makeHTTPRequest()
        );

        const preWaitResults = await Promise.allSettled(preWaitRequests);
        const preWaitSuccessCount = howManyHTTPRequestsPassedRateLimiter(preWaitResults);

        console.log("Success count before waiting:", preWaitSuccessCount);
        expect(preWaitSuccessCount).toBe(0);
    }, (MAX_TIME_PER_HTTP_REQUEST * (HTTP_REQUEST_COUNT * 2)) * SAFETY_MARGIN);

    test("Should rate limit rapid websocket connection requests", async () => {
        console.log("Generating rapid WS requests...");

        const { lobbyId, player } = await createTestLobby();
        const wsUrl = createWsLobbyConnUrl(
            webSocketUrl,
            lobbyId,
            player.token!,
        );
        const rapidRequests = Array.from({ length: WS_REQUEST_COUNT }, () => makeWSRequest(wsUrl));

        const results = await Promise.allSettled(rapidRequests);
        const successCount = howManyWSRequestsPassedRateLimiter(results);

        console.log("Success count:", successCount);
        expect(successCount).toBeLessThanOrEqual(WS_REQUEST_COUNT);
        expect(successCount).toBeGreaterThan(0);
    }, (MAX_TIME_PER_WS_REQUEST * WS_REQUEST_COUNT) * SAFETY_MARGIN);
});

afterEach(() => {
    server?.stop(true);
});
