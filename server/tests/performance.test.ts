import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { CORSResponseBody, HTTPPostRoutes } from "@HTTP";

const CONCURRENCY_LEVELS = [10, 50, 100]; //
const SOAK_TEST_DURATION = 120_000; // 10 seconds
const ACCEPTABLE_LOBBY_CREATION_TIME = 100; // milliseconds

const LOAD_TEST_TIMEOUT = 10000; // 10 seconds
const SPIKE_TEST_TIMEOUT = 10000; // 10 seconds

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

const createTestLobby = async (): Promise<CORSResponseBody<HTTPPostRoutes.CreateLobby>> => {
    const result = await (new MockCreator(serverUrl, webSocketUrl)).createLobby();
    return result;
}

const connectTestLobby = async (): Promise<CORSResponseBody<HTTPPostRoutes.ConnectLobby>> => {
    const { lobbyId } = (await (new MockCreator(serverUrl, webSocketUrl)).createLobby()).data!;
    const result = await (new MockGuest(serverUrl, webSocketUrl)).connectLobby({ name: "guest", lobbyId });
    return result;
}

const reconnectTestLobby = async (): Promise<CORSResponseBody<HTTPPostRoutes.ReconnectLobby>> => {
    const { lobbyId } = (await (new MockCreator(serverUrl, webSocketUrl)).createLobby()).data!;
    const guest = new MockGuest(serverUrl, webSocketUrl)
    const { player } = (await guest.connectLobby({ name: "guest", lobbyId })).data!;
    await guest.disconnectLobby();
    const result = await guest.reconnectLobby({ playerToken: player.token, lobbyId });
    return result;
}

const loadTest = async (clientOperation: () => Promise<CORSResponseBody<HTTPPostRoutes>>): Promise<void> => {
    const resultsSummary: Record<string, number | string | boolean>[] = [];

    for (const concurrency of CONCURRENCY_LEVELS) {
        const latencies: number[] = [];

        const startMem = process.memoryUsage().heapUsed;
        const startCpu = process.cpuUsage();

        const startTime = performance.now();

        const promises = Array.from({ length: concurrency }, async () => {
            const start = performance.now();
            const result = await clientOperation();
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

const spikeTest = async (clientOperation: () => Promise<CORSResponseBody<HTTPPostRoutes>>, lowConcurrency: number, highConcurrency: number) => {
    console.log(`Starting spike test: ${lowConcurrency} → ${highConcurrency} clients`);

    // Low concurrency warm-up
    await Promise.all(Array.from({ length: lowConcurrency }, clientOperation));

    // Spike to high concurrency
    const startMem = process.memoryUsage().heapUsed;
    const startCpu = process.cpuUsage();
    const startTime = performance.now();

    const promises = Array.from({ length: highConcurrency }, clientOperation);
    await Promise.all(promises);

    const endTime = performance.now();
    const endMem = process.memoryUsage().heapUsed;
    const memDiffMB = (endMem - startMem) / 1024 / 1024;
    const cpuTimeMs = (process.cpuUsage(startCpu).user + process.cpuUsage(startCpu).system) / 1000;

    console.log(`Spike test completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`Memory change: ${memDiffMB.toFixed(2)} MB`);
    console.log(`CPU time: ${cpuTimeMs.toFixed(2)} ms`);
};

const soakTest = async (clientOperation: () => Promise<CORSResponseBody<HTTPPostRoutes>>, concurrency: number, durationMs: number) => {
    console.log(`Starting soak test: ${concurrency} clients for ${durationMs / 1000}s`);

    const startMem = process.memoryUsage().heapUsed;
    const memSamples: number[] = [];

    const startCpu = process.cpuUsage();
    const startTime = Date.now();
    let ops = 0;

    while (Date.now() - startTime < durationMs) {
        const batch = Array.from({ length: concurrency }, clientOperation);
        await Promise.all(batch);
        ops += concurrency;

        // Sample memory periodically
        if (ops % (concurrency * 5) === 0) {
            memSamples.push(process.memoryUsage().heapUsed / 1024 / 1024);
        }
    }

    const endCpu = process.cpuUsage(startCpu);
    const cpuTimeMs = (endCpu.user + endCpu.system) / 1000;

    console.log(`Soak test completed. Total operations: ${ops}`);
    console.log(`CPU time: ${cpuTimeMs.toFixed(2)} ms`);
    console.log(`Memory samples (MB):`, memSamples);
    console.log(`Memory change from start: ${(memSamples[memSamples.length - 1] - (startMem / 1024 / 1024)).toFixed(2)} MB`);
};

describe("Performance Tests", () => {
    test("Load test for lobby creation", async () => {
        await loadTest(createTestLobby);
    }, LOAD_TEST_TIMEOUT * CONCURRENCY_LEVELS.length);

    test("Load test for lobby connection", async () => {
        await loadTest(connectTestLobby);
    }, LOAD_TEST_TIMEOUT * CONCURRENCY_LEVELS.length);

    test("Load test for lobby reconnection", async () => {
        await loadTest(reconnectTestLobby);
    }, LOAD_TEST_TIMEOUT * CONCURRENCY_LEVELS.length);

    test("Spike test for lobby creation", async () => {
        await spikeTest(createTestLobby, 10, 500);
    }, SPIKE_TEST_TIMEOUT);

    test("Spike test for lobby connection", async () => {
        await spikeTest(connectTestLobby, 10, 500);
    }, SPIKE_TEST_TIMEOUT);

    test("Spike test for lobby reconnection", async () => {
        await spikeTest(reconnectTestLobby, 10, 500);
    }, SPIKE_TEST_TIMEOUT);

    test("Soak test for lobby creation", async () => {
        await soakTest(createTestLobby, 200, SOAK_TEST_DURATION);
    }, SOAK_TEST_DURATION * 1.5);

    test("Soak test for lobby connection", async () => {
        await soakTest(connectTestLobby, 200, SOAK_TEST_DURATION);
    }, SOAK_TEST_DURATION * 1.5);

    test("Soak test for lobby reconnection", async () => {
        await soakTest(reconnectTestLobby, 200, SOAK_TEST_DURATION);
    }, SOAK_TEST_DURATION * 1.5);
});

afterAll(() => {
    server?.stop(true);
});
