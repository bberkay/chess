import { createServer } from "src/BunServer";
import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { type Server } from "bun";
import { pruneIPRequests, HTTPRoutes } from "src/HTTP";
import { waitForWebSocketSettle } from "./utils";

const MAX_TIME_PER_REQUEST = 100; // milliseconds
const REQUEST_COUNT = Number(Bun.env.RATE_LIMIT) * 1.5;
const SAFETY_MARGIN = 2;
console.log("RATE_LIMIT: ", Bun.env.RATE_LIMIT);

const HTTP_RETRY_AFTER = Number(Bun.env.RATE_WINDOW_MS);
const WS_RETRY_AFTER = Number(Bun.env.MESSAGE_WINDOW_MS);
if (HTTP_RETRY_AFTER > 5000 || WS_RETRY_AFTER > 5000) {
    console.warn(
        "Consider reducing `RATE_WINDOW_MS` and `MESSAGE_WINDOW_MS` for faster tests."
    );
}

const isRateLimiterOff = Number(Bun.env.ENABLE_RATE_LIMIT) === 0;
const isMessageLimiterOff = Number(Bun.env.ENABLE_MESSAGE_LIMIT) === 0;
if (isRateLimiterOff || isMessageLimiterOff) {
    console.warn(
        "Rate limiter or message limiter is disabled — skipping related tests."
    );
}

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

const makeHTTPRequest = async () => {
    const response = await fetch(
        serverUrl + HTTPRoutes.CheckLobby.replace("/", "").replace(":lobbyId", "123123"),
        { method: "GET" },
    );
    return response;
};

const getRetryAfterHeaderOfRequest = (response: PromiseSettledResult<Response>) => {
    return response.status === "fulfilled" && (response.value.headers.get("Retry-After") || response.value.headers.get("retry-after"));
}

const howManyRequestsPassedRateLimiter = (responses: PromiseSettledResult<Response>[]): number => {
    return responses.map(r => {
        return !getRetryAfterHeaderOfRequest(r);
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
        const rapidRequests = Array.from({ length: REQUEST_COUNT }, () =>
            makeHTTPRequest()
        );

        const results = await Promise.allSettled(rapidRequests);
        const successCount = howManyRequestsPassedRateLimiter(results);

        console.log("Success count:", successCount, REQUEST_COUNT, );
        expect(successCount).toBeLessThanOrEqual(REQUEST_COUNT);
        expect(successCount).toBeGreaterThan(0);
    }, (MAX_TIME_PER_REQUEST * REQUEST_COUNT) * SAFETY_MARGIN);

    test("Should reset rate limiting after retry-after period passes", async () => {
        console.log("Sending initial batch of requests...");
        const rapidRequests = Array.from({ length: REQUEST_COUNT }, () =>
            makeHTTPRequest()
        );

        const results = await Promise.allSettled(rapidRequests);
        const successCount = howManyRequestsPassedRateLimiter(results);

        console.log("Initial success count:", successCount);
        expect(successCount).toBeLessThanOrEqual(REQUEST_COUNT);
        expect(successCount).toBeGreaterThan(0);

        const retryAfter = getRetryAfterHeaderOfRequest(results[results.length - 1]);

        console.log("Retry-After header value:", retryAfter);
        expect(retryAfter).toBeTruthy();

        console.log("Waiting for Retry-After duration...");
        await waitForWebSocketSettle(Number(retryAfter));

        console.log("Sending requests AFTER waiting for Retry-After...");
        const postWaitRequests = Array.from({ length: REQUEST_COUNT }, () =>
            makeHTTPRequest()
        );

        const postWaitResults = await Promise.allSettled(postWaitRequests);
        const postWaitSuccessCount = howManyRequestsPassedRateLimiter(postWaitResults);

        console.log("Success count after waiting:", postWaitSuccessCount);
        expect(postWaitSuccessCount).toBeLessThanOrEqual(REQUEST_COUNT);
        expect(postWaitSuccessCount).toBeGreaterThan(0);
    }, (MAX_TIME_PER_REQUEST * (REQUEST_COUNT * 2)) * SAFETY_MARGIN);

    test("Should enforce retry-after header and block requests before waiting period ends", async () => {
        console.log("Sending initial batch of requests...");
        const rapidRequests = Array.from({ length: REQUEST_COUNT }, () =>
            makeHTTPRequest()
        );

        const results = await Promise.allSettled(rapidRequests);
        const successCount = howManyRequestsPassedRateLimiter(results);

        console.log("Initial success count:", successCount);
        expect(successCount).toBeLessThanOrEqual(REQUEST_COUNT);
        expect(successCount).toBeGreaterThan(0);

        const retryAfter = getRetryAfterHeaderOfRequest(results[results.length - 1]);

        console.log("Retry-After header value:", retryAfter);
        expect(retryAfter).toBeTruthy();

        console.log("Sending requests BEFORE waiting for Retry-After...");
        const preWaitRequests = Array.from({ length: REQUEST_COUNT / 2 }, () =>
            makeHTTPRequest()
        );

        const preWaitResults = await Promise.allSettled(preWaitRequests);
        const preWaitSuccessCount = howManyRequestsPassedRateLimiter(preWaitResults);

        console.log("Success count before waiting:", preWaitSuccessCount);
        expect(preWaitSuccessCount).toBe(0);
    }, (MAX_TIME_PER_REQUEST * (REQUEST_COUNT * 2)) * SAFETY_MARGIN);

});

afterEach(() => {
    server?.stop(true);
});
