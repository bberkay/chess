import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { CORSResponseBody, HTTPRoutes } from "@HTTP";
import { MockClient } from "./helpers/MockClient";

const MAX_TIME_PER_HTTP_REQUEST = 10; // milliseconds
const TEST_CONCURRENCY_LEVELS = [10, 50, 100]; // number of simultaneous requests
const TEST_CONCURRENCY_LEVELS_TIMEOUT = TEST_CONCURRENCY_LEVELS
    .map(l => l * MAX_TIME_PER_HTTP_REQUEST)
    .reduce((a, b) => a + b, 0);

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

const measureOperation = async (
    operation: (
        level: number,
        i: number,
    ) => Promise<CORSResponseBody<HTTPRoutes>>,
    acceptableTime: number
): Promise<void> => {
    const resultsSummary: Record<string, number | string | boolean>[] = [];

    for (const [level, concurrency] of TEST_CONCURRENCY_LEVELS.entries()) {
        const latencies: number[] = [];

        const startMem = process.memoryUsage().heapUsed;
        const startCpu = process.cpuUsage();

        const startTime = performance.now();

        const promises = Array.from(
            { length: concurrency },
            async (_, i: number) => {
                const start = performance.now();
                const result = await operation(level, i);
                latencies.push(performance.now() - start);
                return result;
            },
        );

        const results = await Promise.all(promises);
        expect(results.every((r) => r.success)).toBe(true);

        const endTime = performance.now();
        const totalTimeMs = endTime - startTime;
        const totalTimeSec = totalTimeMs / 1000;

        const endMem = process.memoryUsage().heapUsed;
        const memDiffMB = (endMem - startMem) / 1024 / 1024;
        const endCpu = process.cpuUsage(startCpu);
        const cpuTimeMs = (endCpu.user + endCpu.system) / 1000;

        latencies.sort((a, b) => a - b);
        const avgLatency =
            latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
        const p95 = latencies[Math.floor(latencies.length * 0.95)];
        const p99 = latencies[Math.floor(latencies.length * 0.99)];
        const maxLatency = latencies[latencies.length - 1];
        const minLatency = latencies[0];
        const variance =
            latencies.reduce(
                (sum, val) => sum + Math.pow(val - avgLatency, 2),
                0,
            ) / latencies.length;
        const stdDev = Math.sqrt(variance);

        const throughputRPS = concurrency / totalTimeSec;

        const row = {
            Concurrency: concurrency,
            "Avg Latency (ms)": avgLatency,
            "p95 Latency (ms)": p95,
            "p99 Latency (ms)": p99,
            "Max Latency (ms)": maxLatency,
            "Min Latency (ms)": minLatency,
            "Std Dev (ms)": stdDev,
            "Throughput (req/sec)": throughputRPS,
            "Total Time (s)": totalTimeSec,
            "CPU Time (ms)": cpuTimeMs,
            "Memory Change (MB)": memDiffMB
        };
        resultsSummary.push(row);
    }

    console.table(resultsSummary);

    for (const results of resultsSummary) {
        expect(Number(results["p95 Latency (ms)"])).toBeLessThan(
            acceptableTime * 1.25,
        );
        expect(Number(results["p99 Latency (ms)"])).toBeLessThan(
            acceptableTime * 1.5,
        );
        expect(Number(results["Max Latency (ms)"])).toBeLessThan(
            acceptableTime * 2,
        );
        expect(Number(results["Min Latency (ms)"])).toBeLessThan(
            acceptableTime / 2,
        );
    }
};

const createTestLobby = async (): Promise<
    [MockCreator, CORSResponseBody<HTTPRoutes.CreateLobby>]
> => {
    const creator = new MockCreator(serverUrl, webSocketUrl);
    const createLobbyResponse = await creator.createLobby();
    return [creator, createLobbyResponse];
};

const connectTestLobby = async (
    lobbyId: string,
): Promise<[MockGuest, CORSResponseBody<HTTPRoutes.ConnectLobby>]> => {
    const guest = new MockGuest(serverUrl, webSocketUrl);
    const connectLobbyResponse = await guest.connectLobby({
        name: "guest",
        lobbyId,
    });
    return [guest, connectLobbyResponse];
};

const disconnectLobbyTestLobby = async (client: MockClient): Promise<void> => {
    await client.disconnectLobby();
};

const reconnectTestLobby = async (
    client: MockClient,
): Promise<[MockClient, CORSResponseBody<HTTPRoutes.ReconnectLobby>]> => {
    const reconnectLobbyResponse = await client.reconnectLobby();
    return [client, reconnectLobbyResponse];
};

const isRateLimiterOn = Number(Bun.env.ENABLE_RATE_LIMIT) === 1;
describe.skipIf(isRateLimiterOn)("Performance Tests", () => {
    test(
        "Should scale efficiently across concurrency levels during lobby creation",
        async () => {
            const ACCEPTABLE_LOBBY_CREATION_TIME = 100; // milliseconds

            await measureOperation(async () => {
                return (await createTestLobby())[1];
            }, ACCEPTABLE_LOBBY_CREATION_TIME);
        },
        TEST_CONCURRENCY_LEVELS_TIMEOUT
    );

    test(
        "Should scale efficiently across concurrency levels during lobby connection",
        async () => {
            // The first 100 ms is for the lobby connection, and the second 100 ms is for
            // starting the game (since the game begins immediately after the connection,
            // we should include that time as well).
            // See WebSocketHandler._joinLobby(...) for more details.
            const ACCEPTABLE_LOBBY_CONNECTION_TIME = 100 + 100; // milliseconds

            console.log("Lobbies are preparing for connection test...");
            const lobbyIds: string[][] = [];
            for (const concurrency of TEST_CONCURRENCY_LEVELS) {
                const level = [];
                for (let i = 0; i < concurrency; i++) {
                    const [, createLobbyResponse] = await createTestLobby();
                    level.push(createLobbyResponse.data!.lobbyId);
                }
                lobbyIds.push(level);
            }

            console.log("Lobbies are ready for connection test.");
            await measureOperation(async (level: number, i: number) => {
                return (await connectTestLobby(lobbyIds[level][i]))[1];
            }, ACCEPTABLE_LOBBY_CONNECTION_TIME);
        },
        TEST_CONCURRENCY_LEVELS_TIMEOUT
    );

    test(
        "Should scale efficiently across concurrency levels during lobby reconnection",
        async () => {
            // 100 ms is for the lobby reconnection, and 50 ms is for
            // resending the game info to the reconnected player.
            // See WebSocketHandler._joinLobby(...) for more.
            const ACCEPTABLE_LOBBY_RECONNECTION_TIME = 100 + 50; // milliseconds

            console.log("Lobbies are preparing for reconnection test...");
            const clients: MockClient[][] = [];
            for (const concurrency of TEST_CONCURRENCY_LEVELS) {
                const level = [];
                for (let i = 0; i < concurrency; i++) {
                    const [, createLobbyResponse] = await createTestLobby();
                    const [mockClient] = await connectTestLobby(
                        createLobbyResponse.data!.lobbyId,
                    );
                    await disconnectLobbyTestLobby(mockClient);
                    level.push(mockClient);
                }
                clients.push(level);
            }

            console.log("Lobbies are ready for reconnection test.");
            await measureOperation(async (level: number, i: number) => {
                return (await reconnectTestLobby(clients[level][i]))[1];
            }, ACCEPTABLE_LOBBY_RECONNECTION_TIME);
        },
        TEST_CONCURRENCY_LEVELS_TIMEOUT
    );
});

afterAll(() => {
    server?.stop(true);
});
