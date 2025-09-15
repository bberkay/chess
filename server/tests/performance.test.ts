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

// Number of simultaneous requests
const TEST_CONCURRENCY_LEVELS = [1, 10, 50, 100, 1000, 2000];

// Multiplier applied to acceptable performance thresholds
// to provide buffer against unexpected delays or load spikes.
const SAFETY_MARGIN = 1.5;

const MeasurementConfig = {
    AcceptableLobbyCreationMs: 0.4,

    // Since the game begins immediately after the connection,
    // we should include that time as well
    // See WebSocketHandler._joinLobby(...) for more details.
    AcceptableLobbyConnectionMs: 1.2, // 0.5 + 0.7

    // Since the game resending immediately after the connection,
    // we should include that time as well
    // See WebSocketHandler._joinLobby(...) for more details.
    AcceptableLobbyReconnectionMs: 0.7, // 0.5 + 0.2
};

const createTimeoutForTest = (tt: number) => {
    const totalConcurrencyRun = TEST_CONCURRENCY_LEVELS.reduce(
        (acc, val) => acc + ((val * 50) * tt),
        0,
    );
    return (
        totalConcurrencyRun *
        SAFETY_MARGIN
    );
};

const isRateLimiterOn = Number(Bun.env.ENABLE_RATE_LIMIT) === 1;
if (isRateLimiterOn) {
    throw new Error(
        "Consider disabling `ENABLE_RATE_LIMIT` from .env.test to run performance tests.",
    );
}

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

const measureOperation = async (
    operation: (
        level: number,
        i: number,
    ) => Promise<CORSResponseBody<HTTPRoutes>>,
    acceptableTime: number,
): Promise<void> => {
    const perfMonitor = new PerformanceMonitor();
    const memMonitor = new MEMMonitor();
    const cpuMonitor = new CPUMonitor();

    const print = (resultsSummary: ResultsSummary[]): void => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { Concurrency, ...scheme } = resultsSummary[0];
        const tableTypes = Object.keys(scheme);
        const tables = Object.fromEntries(tableTypes.map((k) => [k, []]));
        for (let i = 0; i < tableTypes.length; i++) {
            for (const status of resultsSummary) {
                // @ts-expect-error is going to make code too complicated
                // for just a simple test file
                tables[tableTypes[i]].push({
                    Concurrency: status.Concurrency,
                    // @ts-expect-error is going to make code too complicated
                    // for just a simple test file
                    ...status[tableTypes[i]],
                });
            }
        }

        for (const tableType in tables) {
            console.log(tableType);
            console.table(tables[tableType]);
        }
    };

    const validate = (resultsSummary: ResultsSummary[]) => {
        for (const results of resultsSummary) {
            const concurrency = Number(results["Concurrency"]);
            perfMonitor.validate(
                results.PerfStatistics,
                concurrency,
                acceptableTime,
            );
            cpuMonitor.validate(results.CPUStatistics, concurrency);
            memMonitor.validate(results.MEMStatistics, concurrency);
        }
    };

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
                // Random delay between 0-50ms (simulates real user behavior)
                const randomDelayMs = Math.random() * 50;
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

    print(resultsSummary);
    validate(resultsSummary);
};

const activeClients: MockClient[] = [];
describe.skipIf(isRateLimiterOn)("Performance Tests", () => {
    test(
        "Should scale efficiently across concurrency levels during lobby creation",
        async () => {
            await measureOperation(async () => {
                const mockClient = new MockCreator(serverUrl, webSocketUrl);
                const createLobbyResponse = await mockClient.createLobby(undefined, true);
                activeClients.push(mockClient);
                return createLobbyResponse;
            }, MeasurementConfig.AcceptableLobbyCreationMs);
        },
        createTimeoutForTest(MeasurementConfig.AcceptableLobbyCreationMs)
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

            console.log("Lobbies are ready for connection test.");
            console.log("lobbyIds: ", lobbyIds);
            await measureOperation(async (level: number, i: number) => {
                console.log("b: ", level, i);
                const guest = new MockGuest(serverUrl, webSocketUrl);
                const connectLobbyResponse = await guest.connectLobby({
                    name: "guest",
                    lobbyId: lobbyIds[level][i],
                });
                return connectLobbyResponse;
            }, MeasurementConfig.AcceptableLobbyConnectionMs);
        },
        createTimeoutForTest(
            MeasurementConfig.AcceptableLobbyCreationMs *
                MeasurementConfig.AcceptableLobbyConnectionMs,
        ),
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

            console.log("Lobbies are ready for reconnection test.");
            await measureOperation(async (level: number, i: number) => {
                const reconnectLobbyResponse =
                    await clients[level][i].reconnectLobby();
                return reconnectLobbyResponse;
            }, MeasurementConfig.AcceptableLobbyReconnectionMs);
        },
        createTimeoutForTest(
            MeasurementConfig.AcceptableLobbyCreationMs *
                MeasurementConfig.AcceptableLobbyConnectionMs *
                MeasurementConfig.AcceptableLobbyReconnectionMs,
        ),
    );
});

afterEach(async () => {
    await Promise.all(activeClients.map((client) => client.disconnectLobby()));
    activeClients.length = 0;
    server?.stop(true);
});
