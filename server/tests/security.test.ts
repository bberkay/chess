import { createServer } from "src/BunServer";
import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { type Server } from "bun";
import { pruneIPRequests, HTTPRoutes, HTTPResponseData } from "src/HTTP";
import { createWsLobbyConnUrl, testFetch, waitForWebSocketSettle } from "./utils";
import { TEST_BOARD } from "./consts";

// Check rate and message limiter
const isRateLimiterOff = Number(Bun.env.ENABLE_RATE_LIMIT) === 0;
const isMessageLimiterOff = Number(Bun.env.ENABLE_MESSAGE_LIMIT) === 0;
if (isRateLimiterOff || isMessageLimiterOff) {
    console.warn(
        "Consider enabling `ENABLE_RATE_LIMIT` and `ENABLE_MESSAGE_LIMIT` from .env.test to run rate limiting tests."
    );
}

// Create timeouts
const WS_CONN_TIMEOUT = 10000;
const MAX_TIME_PER_HTTP_REQUEST = 100; // milliseconds
const MAX_TIME_PER_WS_REQUEST = 100; // milliseconds

// Create request counts
const HTTP_REQUEST_COUNT = Number(Bun.env.RATE_LIMIT) * 1.5;
const WS_REQUEST_COUNT = Number(Bun.env.MESSAGE_LIMIT) * 1.5;
console.log(".RATE_LIMIT from .env.test: ", Bun.env.RATE_LIMIT);
console.log(".MESSAGE_LIMIT from .env.test: ", Bun.env.MESSAGE_LIMIT);
if (Number(Bun.env.RATE_LIMIT) > 5000 || Number(Bun.env.MESSAGE_LIMIT) > 5000) {
    console.warn(
        "Consider reducing `RATE_WINDOW_MS` and `MESSAGE_WINDOW_MS` from .env.test for faster tests."
    );
}

// Create windows
const SAFETY_MARGIN = 2;
const HTTP_RETRY_AFTER = Number(Bun.env.RATE_WINDOW_MS);
const WS_RETRY_AFTER = Number(Bun.env.MESSAGE_WINDOW_MS);
console.log(".RATE_WINDOW_MS from .env.test: ", Bun.env.RATE_WINDOW_MS);
console.log(".MESSAGE_WINDOW_MS from .env.test: ", Bun.env.MESSAGE_WINDOW_MS);
if (HTTP_RETRY_AFTER > 5000 || WS_RETRY_AFTER > 5000) {
    console.warn(
        "Consider reducing `RATE_WINDOW_MS` and `MESSAGE_WINDOW_MS` from .env.test for faster tests."
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

const getRetryAfterHeaderOfRequest = (response: PromiseSettledResult<Response>) => {
    return response.status === "fulfilled" && (response.value.headers.get("Retry-After") || response.value.headers.get("retry-after"));
}

const howManyHTTPRequestsPassedRateLimiter = (responses: PromiseSettledResult<Response>[]): number => {
    return responses.map(r => {
        return !getRetryAfterHeaderOfRequest(r);
    }).filter(Boolean).length;
}

const howManyWSRequestsPassedRateLimiter = (responses: PromiseSettledResult<string | false>[]): number => {
    return responses.map(r => {
        return !!r;
    }).filter(Boolean).length;
}

beforeEach(async () => {
    server = createServer();
    pruneIPRequests(true);
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

describe.skipIf(isRateLimiterOff || isMessageLimiterOff)("Rate Limiting & DoS Protection", () => {
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

        const retryAfter = getRetryAfterHeaderOfRequest(results[results.length - 1]);

        console.log("Retry-After header value:", retryAfter);
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

        const retryAfter = getRetryAfterHeaderOfRequest(results[results.length - 1]);

        console.log("Retry-After header value:", retryAfter);
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

    test("Should limit rapid websocket connection requests", async () => {
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
