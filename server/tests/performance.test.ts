import { createServer } from "src/BunServer";
import { test, expect, describe, afterEach, beforeEach } from "vitest";
import { type Server } from "bun";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { CORSResponseBody, HTTPRoutes } from "@HTTP";
import { MockClient } from "./helpers/MockClient";
import { warmUp } from "./utils";
import { median } from "@Utils";
import { CPUMonitor, CPUStatistics } from "./helpers/CPUMonitor";
import { MEMMonitor, MEMStatistics } from "./helpers/MemoryMonitor";
import { PerformanceMonitor, PerfStatistics } from "./helpers/PerformanceMonitor";

// Number of simultaneous requests
const TEST_CONCURRENCY_LEVELS = [10, 50, 100];

const MeasurementConfig = {
    AcceptableLobbyCreationMs: 0.75,

    // Since the game begins immediately after the connection,
    // we should include that time as well
    // See WebSocketHandler._joinLobby(...) for more details.
    AcceptableLobbyConnectionMs: 1.2, // 0.5 + 0.7

    // Since the game resending immediately after the connection,
    // we should include that time as well
    // See WebSocketHandler._joinLobby(...) for more details.
    AcceptableLobbyReconnectionMs: 0.7, // 0.5 + 0.2

    // Number of times an operation should be executed to validate
    // that the performance measurements are reliable.
    ValidationRuns: 10,

    // Minimum fraction (0–1) of validation runs that must succeed
    // for the measurement to be considered acceptable.
    // Example: 0.95 means at least 95% of runs must pass.
    AcceptablePassRate: 0.95,

    // Percentage by which the acceptable time is reduced after
    // each successful validation iteration.
    // Example: 10 means acceptable time is tightened by 10%.
    TimeReductionRate: 10
};

const isRateLimiterOn = Number(Bun.env.ENABLE_RATE_LIMIT) === 1;
if (isRateLimiterOn) {
    throw new Error(
        "Consider disabling `ENABLE_RATE_LIMIT` from .env.test to run performance tests.",
    );
}

type ResultsSummary = { Concurrency: number } & { MEMStatistics: MEMStatistics } & {
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
    suggestOptimalAcceptableTime: boolean = true,
): Promise<void> => {
    const perfMonitor = new PerformanceMonitor();
    const memMonitor = new MEMMonitor();
    const cpuMonitor = new CPUMonitor();

    const print = (measureResult: ResultsSummary[]): void => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { Concurrency, ...scheme } = measureResult[0];
        const tableTypes = Object.keys(scheme);
        const tables = Object.fromEntries(tableTypes.map((k) => [k, []]));
        for (let i = 0; i < tableTypes.length; i++) {
            for (const status of measureResult) {
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

    const normalize = (data: ResultsSummary[][]): ResultsSummary[] => {
        if (!data.length) return [];

        const groups = data[0].length;
        const result: ResultsSummary[] = [];

        for (let i = 0; i < groups; i++) {
            const items = data.map((run) => run[i]);
            const concurreny = items[0].Concurrency;
            const combined: Record<string, Record<string, number[]>> = {};
            for (const item of items) {
                for (const key in item) {
                    const k = key as Exclude<
                        keyof ResultsSummary,
                        "Concurrency"
                    >;
                    if (!Object.hasOwn(combined, k)) {
                        combined[k] = Object.fromEntries(
                            Object.entries(item[k]).map(([k]) => [k, []]),
                        );
                    }
                    for (const metric in item[k]) {
                        const m = metric as keyof ResultsSummary[typeof k];
                        combined[k][metric].push(item[k][m]);
                    }
                }
            }

            const medians: Partial<ResultsSummary> = {
                Concurrency: concurreny,
            };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { Concurrency, ...combinedWithoutCurrency } = combined;
            for (const key in combinedWithoutCurrency) {
                const k = key as Exclude<keyof ResultsSummary, "Concurrency">;
                if (!Object.hasOwn(medians, k)) {
                    medians[k] = Object.fromEntries(
                        Object.entries(combinedWithoutCurrency[k]!).map(
                            ([metric]) => [metric, 0],
                        ),
                    ) as keyof ResultsSummary[typeof k];
                }
                for (const metric in combinedWithoutCurrency[k]!) {
                    const m = metric as keyof ResultsSummary[typeof k];
                    // @ts-expect-error is going to make code too complicated
                    // for just a simple test file
                    medians[k]![m] = median(
                        combinedWithoutCurrency[k]![metric]!,
                    ).toFixed(2);
                }
            }

            result.push(medians as ResultsSummary);
        }

        return result;
    };

    const measure = async (): Promise<ResultsSummary[]> => {
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
                        return await operation(level, i)
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
            const totalTimeMs = endTime - startTime - randomDelays[randomDelays.length - 1];

            const row: ResultsSummary = {
                Concurrency: concurrency,
                CPUStatistics: cpuMonitor.get(totalTimeMs),
                PerfStatistics: perfMonitor.get(totalTimeMs),
                MEMStatistics: memMonitor.get(),
            };

            resultsSummary.push(row);
        }

        return resultsSummary;
    };

    const validate = (resultsSummary: ResultsSummary[]) => {
        for (const results of resultsSummary) {
            const concurrency = Number(results["Concurrency"]);
            try {
                perfMonitor.validate(results.PerfStatistics, concurrency, acceptableTime);
                cpuMonitor.validate(results.CPUStatistics, concurrency);
                memMonitor.validate(results.MEMStatistics, concurrency);
            } catch {
                return false;
            }
        }
        return true;
    };

    let allValidationRuns: ResultsSummary[][] = [];
    let optimalTimeMeasurementIter = 0;
    while (acceptableTime > 0) {
        allValidationRuns = [];

        let successCount = 0;
        for (let i = 0; i < MeasurementConfig.ValidationRuns; i++) {
            const resultsSummary = await measure();
            allValidationRuns.push(resultsSummary);
            successCount += validate(resultsSummary) ? 1 : 0;
        }

        try {
            expect(
                (successCount * MeasurementConfig.ValidationRuns) / 100,
            ).toBeGreaterThanOrEqual(
                MeasurementConfig.AcceptablePassRate,
            );
            if (!suggestOptimalAcceptableTime) break;
        } catch (e: unknown) {
            if (optimalTimeMeasurementIter == 0) throw e;
            if (suggestOptimalAcceptableTime) {
                console.log(
                    `Suggested Acceptable Time: ${acceptableTime.toFixed(3)} ms`,
                );
            }
            break;
        }

        acceptableTime -= (acceptableTime * MeasurementConfig.TimeReductionRate) / 100;
        optimalTimeMeasurementIter += 1;
    }

    const finalStatus = normalize(allValidationRuns);
    print(finalStatus);
};

const activeClients: MockClient[] = [];
describe.skipIf(isRateLimiterOn)("Performance Tests", () => {
    test("Should scale efficiently across concurrency levels during lobby creation", async () => {
        await measureOperation(async () => {
            const mockClient = new MockCreator(serverUrl, webSocketUrl);
            const createLobbyResponse = await mockClient.createLobby();
            activeClients.push(mockClient);
            return createLobbyResponse;
        }, MeasurementConfig.AcceptableLobbyCreationMs);
    }, 10000000000);

    test("Should scale efficiently across concurrency levels during lobby connection", async () => {
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
        await measureOperation(async (level: number, i: number) => {
            const guest = new MockGuest(serverUrl, webSocketUrl);
            const connectLobbyResponse = await guest.connectLobby({
                name: "guest",
                lobbyId: lobbyIds[level][i],
            });
            return connectLobbyResponse;
        }, MeasurementConfig.AcceptableLobbyConnectionMs);
    });

    test("Should scale efficiently across concurrency levels during lobby reconnection", async () => {
        console.log("Lobbies are preparing for reconnection test...");
        const clients: MockClient[][] = [];
        for (const concurrency of TEST_CONCURRENCY_LEVELS) {
            const level = [];
            for (let i = 0; i < concurrency; i++) {
                const mockCreator = new MockCreator(serverUrl, webSocketUrl);
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
    });
});

afterEach(async () => {
    await Promise.all(activeClients.map((client) => client.disconnectLobby()));
    activeClients.length = 0;
    server?.stop(true);
});
