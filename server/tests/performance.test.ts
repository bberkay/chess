import { createServer } from "src/BunServer";
import { test, expect, describe, afterEach, beforeEach } from "vitest";
import { type Server } from "bun";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { CORSResponseBody, HTTPRoutes } from "@HTTP";
import { MockClient } from "./helpers/MockClient";
import { warmUp } from "./utils";
import { CPUMonitor, CPUStatistics } from "./helpers/CPUMonitor";
import { MEMMonitor, MEMStatistics } from "./helpers/MemoryMonitor";
import {
    PerformanceMonitor,
    PerfStatistics,
} from "./helpers/PerformanceMonitor";

const isRateLimiterOn = Number(Bun.env.ENABLE_RATE_LIMIT) === 1;
if (isRateLimiterOn) {
    console.error(
        "Consider disabling `ENABLE_RATE_LIMIT` from .env.test to run performance tests.",
    );
}

//
// -------------- CONFIG --------------
//

// PERF_MODE values:
//   0 = regression (CI/CD) → adaptive thresholds, fails on real regressions
//   1 = benchmark  (local) → prints detailed metrics, does not fail tests
const MODE = Number(Bun.env.PERF_MODE) === 0 ? "regression" : "benchmark";
if (MODE === "regression") {
    console.warn(
        "[PERF_MODE=0] Running in regression mode. " +
        "Tests will enforce adaptive thresholds and may fail if performance regresses."
    );
} else {
    console.warn(
        "[PERF_MODE=1] Running in benchmark mode. " +
        "Tests will print metrics only and will not fail on slow performance."
    );
}

// Number of simultaneous requests
const TEST_CONCURRENCY_LEVELS = MODE === "regression" ? [1, 10, 100] : [1, 100, 1000, 10_000];

// Random delay between 0-50ms (simulates real user behavior)
const BASELINE_MEASURE_RUN = 50;

// Random delay between 0-50ms (simulates real user behavior)
const MAX_REAL_USER_DELAY_MS = 50;

//
const TIMEOUT = 60_000;

type ResultsSummary = { Concurrency: number } & {
    MEMStatistics: MEMStatistics;
} & {
    CPUStatistics: CPUStatistics;
} & { PerfStatistics: PerfStatistics };

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeEach(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
    await warmUp(serverUrl);
    if (typeof globalThis.gc === "function") globalThis.gc();
});

//
// -------------- BASELINE LOGIC --------------
//
async function measureBaseline(fn: () => Promise<unknown>): Promise<number> {
    const times: number[] = [];
    for (let i = 0; i < BASELINE_MEASURE_RUN; i++) {
        const start = performance.now();
        await fn();
        times.push(performance.now() - start);
    }
    const avg = times.reduce((a, b) => a + b, 0) / BASELINE_MEASURE_RUN;
    return avg;
}

//
// -------------- MEASURE FUNCTION --------------
//
const measureOperation = async (
    operation: (
        level: number,
        i: number,
    ) => Promise<CORSResponseBody<HTTPRoutes>>,
    baseline: number,
): Promise<void> => {
    const perfMonitor = new PerformanceMonitor();
    const memMonitor = new MEMMonitor();
    const cpuMonitor = new CPUMonitor();

    const resultsSummary: ResultsSummary[] = [];

    for (const [level, concurrency] of TEST_CONCURRENCY_LEVELS.entries()) {
        const startTime = performance.now();

        perfMonitor.start(concurrency);
        memMonitor.start(concurrency);
        cpuMonitor.start(concurrency);

        const randomDelays: number[] = [];
        const promises = Array.from(
            { length: concurrency },
            async (_, i: number) => {
                const randomDelayMs = Math.random() * MAX_REAL_USER_DELAY_MS;
                randomDelays.push(randomDelayMs);
                await new Promise((resolve) =>
                    setTimeout(resolve, randomDelayMs),
                );

                return await perfMonitor.watch(async () => {
                    const res = await operation(level, i);
                    return res;
                });
            },
        );

        const results = await Promise.all(promises);
        expect(results.every((r) => r.success)).toBe(true);

        perfMonitor.end();
        cpuMonitor.end();
        memMonitor.end();

        const endTime = performance.now();
        randomDelays.sort();
        const totalTimeMs =
            endTime - startTime - randomDelays[randomDelays.length - 1];

        const row: ResultsSummary = {
            Concurrency: concurrency,
            CPUStatistics: cpuMonitor.get(totalTimeMs),
            PerfStatistics: perfMonitor.get(totalTimeMs),
            MEMStatistics: memMonitor.get(),
        };

        resultsSummary.push(row);
    }

    // Always print results
    for (const tableType of Object.keys(resultsSummary[0]).filter(k => k !== "Concurrency")) {
        console.log(tableType);
        console.table(resultsSummary.map((r) => ({
            Concurrency: r.Concurrency,
            // @ts-expect-error Fixing this would make the
            // code too complicated
            ...r[tableType as keyof ResultsSummary],
        })));
    }

    // Only validate in regression mode
    if (MODE === "regression") {
        if (!baseline) throw new Error(`Baseline could not found.`);
        for (const results of resultsSummary) {
            perfMonitor.validate(results.PerfStatistics);
            cpuMonitor.validate(results.CPUStatistics);
            memMonitor.validate(results.MEMStatistics);
        }
    }
};

const activeClients: MockClient[] = [];
describe.skipIf(isRateLimiterOn)("Performance Tests", () => {
    test(
        "Should scale efficiently across concurrency levels during lobby creation",
        async () => {
            console.log("Measuring baseline for lobby connection test...");
            const lobbyCreationBaseline = await measureBaseline(async () => {
                const c = new MockCreator(serverUrl, webSocketUrl);
                return c.createLobby();
            });

            console.log("Lobbies are ready for creation test.");
            await measureOperation(async () => {
                const mockClient = new MockCreator(serverUrl, webSocketUrl);
                const createLobbyResponse = await mockClient.createLobby();
                activeClients.push(mockClient);
                return createLobbyResponse;
            }, lobbyCreationBaseline);
        },
        TIMEOUT
    );

    test(
        "Should scale efficiently across concurrency levels during lobby connection",
        async () => {
            console.log("Lobbies are preparing for connection test...");
            const lobbyIds: string[][] = [];
            for (const concurrency of TEST_CONCURRENCY_LEVELS) {
                const level = [];
                for (let i = 0; i < concurrency; i++) {
                    const mockClient = new MockCreator(serverUrl, webSocketUrl);
                    const createLobbyResponse = await mockClient.createLobby();
                    activeClients.push(mockClient);
                    level.push(createLobbyResponse.data!.lobbyId);
                }
                lobbyIds.push(level);
            }

            console.log("Measuring baseline for lobby connection test...");
            const lobbyConnectionBaseline = await measureBaseline(async () => {
                const c = new MockCreator(serverUrl, webSocketUrl);
                return c.createLobby();
            });

            console.log("Lobbies are ready for connection test.");
            await measureOperation(async (level: number, i: number) => {
                const guest = new MockGuest(serverUrl, webSocketUrl);
                const connectLobbyResponse = await guest.connectLobby({
                    name: "guest",
                    lobbyId: lobbyIds[level][i],
                });
                return connectLobbyResponse;
            }, lobbyConnectionBaseline);
        },
        TIMEOUT
    );

    test(
        "Should scale efficiently across concurrency levels during lobby reconnection",
        async () => {
            console.log("Lobbies are preparing for reconnection test...");
            const clients: MockClient[][] = [];
            for (const concurrency of TEST_CONCURRENCY_LEVELS) {
                const level = [];
                for (let i = 0; i < concurrency; i++) {
                    const mockCreator = new MockCreator(
                        serverUrl,
                        webSocketUrl,
                    );
                    const createLobbyResponse = await mockCreator.createLobby();
                    activeClients.push(mockCreator);
                    const mockGuest = new MockGuest(serverUrl, webSocketUrl);
                    await mockGuest.connectLobby({
                        name: "guest",
                        lobbyId: createLobbyResponse.data!.lobbyId,
                    });
                    activeClients.push(mockGuest);
                    await mockGuest.disconnectLobby();
                    level.push(mockGuest);
                }
                clients.push(level);
            }

            console.log("Measuring baseline for lobby reconnection test...");
            const lobbyReconnectionBaseline = await measureBaseline(async () => {
                const c = new MockCreator(serverUrl, webSocketUrl);
                return c.createLobby();
            });

            console.log("Lobbies are ready for reconnection test.");
            await measureOperation(async (level: number, i: number) => {
                const reconnectLobbyResponse =
                    await clients[level][i].reconnectLobby();
                return reconnectLobbyResponse;
            }, lobbyReconnectionBaseline);
        },
        TIMEOUT
    );
});

afterEach(async () => {
    await Promise.all(activeClients.map((client) => client.disconnectLobby()));
    activeClients.length = 0;
    server?.stop(true);
});
