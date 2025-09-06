import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { CORSResponseBody, HTTPRoutes } from "@HTTP";

const TEST_CONCURRENCY_LEVELS = [10, 50, 100]; // number of simultaneous requests
const ACCEPTABLE_LOBBY_CREATION_TIME = 100; // milliseconds
const TEST_TIMEOUT = 10000; // 10 seconds

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

const measureOperation = async (operation: () => Promise<CORSResponseBody<HTTPRoutes>>): Promise<void> => {
    const resultsSummary: Record<string, number | string | boolean>[] = [];

    for (const concurrency of TEST_CONCURRENCY_LEVELS) {
        const latencies: number[] = [];

        const startMem = process.memoryUsage().heapUsed;
        const startCpu = process.cpuUsage();

        const startTime = performance.now();

        const promises = Array.from({ length: concurrency }, async () => {
            const start = performance.now();
            const result = await operation();
            latencies.push(performance.now() - start);
            return result;
        });

        const results = await Promise.all(promises);
        const endTime = performance.now();
        const totalTimeMs = endTime - startTime;
        const totalTimeSec = totalTimeMs / 1000;

        const endMem = process.memoryUsage().heapUsed;
        const memDiffMB = (endMem - startMem) / 1024 / 1024;
        const endCpu = process.cpuUsage(startCpu);
        const cpuTimeMs = (endCpu.user + endCpu.system) / 1000;

        latencies.sort((a, b) => a - b);
        const avgLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
        const p95 = latencies[Math.floor(latencies.length * 0.95)];
        const p99 = latencies[Math.floor(latencies.length * 0.99)];
        const maxLatency = latencies[latencies.length - 1];
        const minLatency = latencies[0];
        const variance = latencies.reduce((sum, val) => sum + Math.pow(val - avgLatency, 2), 0) / latencies.length;
        const stdDev = Math.sqrt(variance);

        const throughputRPS = concurrency / totalTimeSec;

        expect(results.every(r => r.success)).toBe(true);
        expect(p95).toBeLessThan(ACCEPTABLE_LOBBY_CREATION_TIME * 1.25);
        expect(p99).toBeLessThan(ACCEPTABLE_LOBBY_CREATION_TIME * 1.5);
        expect(maxLatency).toBeLessThan(ACCEPTABLE_LOBBY_CREATION_TIME * 2);
        expect(stdDev).toBeLessThan(ACCEPTABLE_LOBBY_CREATION_TIME / 2);

        const row = {
            "Concurrency": concurrency,
            "Avg Latency (ms)": avgLatency.toFixed(2),
            "p95 Latency (ms)": p95.toFixed(2),
            "p99 Latency (ms)": p99.toFixed(2),
            "Max Latency (ms)": maxLatency.toFixed(2),
            "Min Latency (ms)": minLatency.toFixed(2),
            "Std Dev (ms)": stdDev.toFixed(2),
            "Throughput (req/sec)": throughputRPS.toFixed(2),
            "Total Time (s)": totalTimeSec.toFixed(2),
            "CPU Time (ms)": cpuTimeMs.toFixed(2),
            "Memory Change (MB)": memDiffMB.toFixed(2),
        };
        resultsSummary.push(row);
    }

    console.table(resultsSummary);
}

const createTestLobby = async (): Promise<CORSResponseBody<HTTPRoutes.CreateLobby>> => {
    const result = await (new MockCreator(serverUrl, webSocketUrl)).createLobby();
    return result;
}

const connectTestLobby = async (): Promise<CORSResponseBody<HTTPRoutes.ConnectLobby>> => {
    const { lobbyId } = (await (new MockCreator(serverUrl, webSocketUrl)).createLobby()).data!;
    const result = await (new MockGuest(serverUrl, webSocketUrl)).connectLobby({ name: "guest", lobbyId });
    return result;
}

const reconnectTestLobby = async (): Promise<CORSResponseBody<HTTPRoutes.ReconnectLobby>> => {
    const { lobbyId } = (await (new MockCreator(serverUrl, webSocketUrl)).createLobby()).data!;
    const guest = new MockGuest(serverUrl, webSocketUrl)
    await guest.connectLobby({ name: "guest", lobbyId });
    await guest.disconnectLobby();
    const result = await guest.reconnectLobby();
    return result;
}

const isRateLimiterOn = Number(Bun.env.ENABLE_RATE_LIMIT) === 1;
describe.skipIf(isRateLimiterOn)("Performance Tests", () => {
    test("Should scale efficiently across concurrency levels during lobby creation", async () => {
        await measureOperation(createTestLobby);
    }, TEST_TIMEOUT * TEST_CONCURRENCY_LEVELS.length);

    test("Should scale efficiently across concurrency levels during lobby connection", async () => {
        await measureOperation(connectTestLobby);
    }, TEST_TIMEOUT * TEST_CONCURRENCY_LEVELS.length);

    test("Should scale efficiently across concurrency levels during lobby reconnection", async () => {
        await measureOperation(reconnectTestLobby);
    }, TEST_TIMEOUT * TEST_CONCURRENCY_LEVELS.length);
});

afterAll(() => {
    server?.stop(true);
});
