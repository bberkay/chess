import os from "os";
import { createServer } from "src/BunServer";
import { test, expect, describe, afterEach, beforeEach } from "vitest";
import { type Server } from "bun";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { CORSResponseBody, HTTPRoutes } from "@HTTP";
import { MockClient } from "./helpers/MockClient";
import { warmUp } from "./utils";

const isRateLimiterOn = Number(Bun.env.ENABLE_RATE_LIMIT) === 1;
if (isRateLimiterOn) {
    throw new Error(
        "Consider disabling `ENABLE_RATE_LIMIT` from .env.test to run performance tests.",
    );
}

interface CPUInfo {
    "CPU Time (ms)": number;
    "CPU Utilization (%)": number;
    "CPU Time per Request (ms)": number;
}

interface MEMInfo {
    "Heap (MB)": number;
    "Median Heap (MB)": number;
    "Median RSS (MB)": number;
}

interface PERFInfo {
    "Avg Latency (ms)": number;
    "p95 Latency (ms)": number;
    "p99 Latency (ms)": number;
    "Max Latency (ms)": number;
    "Min Latency (ms)": number;
    "Std Dev (ms)": number;
    "Total Time (s)": number;
    "Throughput (req/sec)": number;
}

type ResultsSummary = { Concurrency: number } & { MemInfo: MEMInfo } & {
    CpuInfo: CPUInfo;
} & { PerfInfo: PERFInfo };

const CORES = os.cpus().length;

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

// number of simultaneous requests
const TEST_CONCURRENCY_LEVELS = [10, 50, 100];
const PERFORMANCE_THRESHOLDS = {
    LOBBY_CREATION: 0.75,
    // Since the game begins immediately after the connection,
    // we should include that time as well
    // See WebSocketHandler._joinLobby(...) for more details.
    LOBBY_CONNECTION: 1.2, // 0.5 + 0.7
    // Since the game resending immediately after the connection,
    // we should include that time as well
    // See WebSocketHandler._joinLobby(...) for more details.
    LOBBY_RECONNECTION: 0.7, // 0.5 + 0.2
    VALIDATION_RUNS: 10,
    ACCEPTABLE_PASS_RATE: 0.95,
};

const measureOperation = async (
    operation: (
        level: number,
        i: number,
    ) => Promise<CORSResponseBody<HTTPRoutes>>,
    acceptableTime: number,
    suggestOptimalAcceptableTime: boolean = true,
): Promise<void> => {
    const printTable = (finalStatus: ResultsSummary[]) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { Concurrency, ...scheme } = finalStatus[0];
        const tableTypes = Object.keys(scheme);
        const tables = Object.fromEntries(tableTypes.map((k) => [k, []]));
        for (let i = 0; i < tableTypes.length; i++) {
            for (const status of finalStatus) {
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

    const median = (values: number[]): number => {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    };

    const combine = (data: ResultsSummary[][]): ResultsSummary[] => {
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

    const percentile = (sorted: number[], p: number): number => {
        if (sorted.length === 0) return 0;
        if (p <= 0) return sorted[0];
        if (p >= 1) return sorted[sorted.length - 1];

        const n = sorted.length;
        // fractional zero-based rank
        const r = p * (n - 1);
        const lower = Math.floor(r);
        const upper = Math.ceil(r);
        const weight = r - lower;

        if (upper === lower) return sorted[lower];
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    };

    const snapshotMemory = () => {
        const mem = process.memoryUsage();
        return {
            heapUsed: mem.heapUsed,
            heapTotal: mem.heapTotal,
            rss: mem.rss,
        };
    };

    const performanceInfo = (
        latencies: number[],
        concurrency: number,
        totalTimeMs: number,
    ): PERFInfo => {
        latencies.sort((a, b) => a - b);
        const avgLatency =
            latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
        const p95 = percentile(latencies, 0.95);
        const p99 = percentile(latencies, 0.99);
        const maxLatency = latencies[latencies.length - 1];
        const minLatency = latencies[0];
        const variance =
            latencies.reduce(
                (sum, val) => sum + Math.pow(val - avgLatency, 2),
                0,
            ) / latencies.length;
        const stdDev = Math.sqrt(variance);

        const totalTimeSec = totalTimeMs / 1000;
        const throughputRPS = concurrency / totalTimeSec;

        return {
            "Avg Latency (ms)": avgLatency,
            "p95 Latency (ms)": p95,
            "p99 Latency (ms)": p99,
            "Max Latency (ms)": maxLatency,
            "Min Latency (ms)": minLatency,
            "Std Dev (ms)": stdDev,
            "Total Time (s)": totalTimeSec,
            "Throughput (req/sec)": throughputRPS,
        };
    };

    const test1 = async (): Promise<ResultsSummary[]> => {
        const resultsSummary: ResultsSummary[] = [];

        for (const [level, concurrency] of TEST_CONCURRENCY_LEVELS.entries()) {
            const latencies: number[] = [];

            // Ready memory
            const samplesMem: Array<ReturnType<typeof snapshotMemory>> = [];
            const samplerMem = setInterval(
                () => samplesMem.push(snapshotMemory()),
                50,
            );
            const startMem = snapshotMemory();

            // Ready cpu
            const startCpu = process.cpuUsage();

            // Ready latency
            const startTime = performance.now();

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

                    const start = performance.now();
                    const result = await operation(level, i);
                    latencies.push(performance.now() - start);
                    return result;
                },
            );

            const results = await Promise.all(promises);
            expect(results.every((r) => r.success)).toBe(true);

            // Latency
            const endTime = performance.now();
            randomDelays.sort();
            const totalTimeMs =
                endTime - startTime - randomDelays[randomDelays.length - 1];
            const performaceInfo = performanceInfo(
                latencies,
                concurrency,
                totalTimeMs,
            );

            // Memory
            clearInterval(samplerMem);
            const endMem = snapshotMemory();
            samplesMem.push(endMem);
            const memInfo: MEMInfo = {
                "Heap (MB)":
                    (endMem.heapUsed - startMem.heapUsed) / 1024 / 1024,
                "Median Heap (MB)":
                    median(samplesMem.map((samp) => samp.heapUsed)) /
                    1024 /
                    1024,
                "Median RSS (MB)":
                    median(samplesMem.map((samp) => samp.rss)) / 1024 / 1024,
            };

            // Cpu
            const endCpu = process.cpuUsage(startCpu);
            const cpuTimeMs = (endCpu.user + endCpu.system) / 1000;
            const wallMs = endTime - startTime;
            const cpuPercent = (cpuTimeMs / (wallMs * CORES)) * 100;
            const cpuMsPerReq = cpuTimeMs / concurrency;
            const cpuInfo: CPUInfo = {
                "CPU Time (ms)": cpuTimeMs,
                "CPU Utilization (%)": cpuPercent,
                "CPU Time per Request (ms)": cpuMsPerReq,
            };

            const row: ResultsSummary = {
                Concurrency: concurrency,
                CpuInfo: cpuInfo,
                PerfInfo: performaceInfo,
                MemInfo: memInfo,
            };
            resultsSummary.push(row);
        }

        return resultsSummary;
    };

    const test2 = (resultsSummary: ResultsSummary[]) => {
        for (const results of resultsSummary) {
            const concurrency = Number(results["Concurrency"]);
            const targetDuration = acceptableTime * concurrency;
            try {
                expect(
                    Number(results.PerfInfo["p95 Latency (ms)"]),
                ).toBeLessThan(targetDuration * 1.25);
                expect(
                    Number(results.PerfInfo["p99 Latency (ms)"]),
                ).toBeLessThan(targetDuration * 1.5);
                expect(
                    Number(results.PerfInfo["Max Latency (ms)"]),
                ).toBeLessThan(targetDuration * 2);
                expect(
                    Number(results.PerfInfo["Min Latency (ms)"]),
                ).toBeLessThan(targetDuration);
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
        for (let i = 0; i < PERFORMANCE_THRESHOLDS.VALIDATION_RUNS; i++) {
            const resultsSummary = await test1();
            allValidationRuns.push(resultsSummary);
            successCount += test2(resultsSummary) ? 1 : 0;
        }

        try {
            expect(
                (successCount * PERFORMANCE_THRESHOLDS.VALIDATION_RUNS) / 100,
            ).toBeGreaterThanOrEqual(
                PERFORMANCE_THRESHOLDS.ACCEPTABLE_PASS_RATE,
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

        acceptableTime -= (acceptableTime * 10) / 100;
        optimalTimeMeasurementIter += 1;
    }

    const finalStatus = combine(allValidationRuns);
    printTable(finalStatus);
};

const activeClients: MockClient[] = [];
describe.skipIf(isRateLimiterOn)("Performance Tests", () => {
    test("Should scale efficiently across concurrency levels during lobby creation", async () => {
        await measureOperation(async () => {
            const mockClient = new MockCreator(serverUrl, webSocketUrl);
            const createLobbyResponse = await mockClient.createLobby();
            activeClients.push(mockClient);
            return createLobbyResponse;
        }, PERFORMANCE_THRESHOLDS.LOBBY_CREATION);
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
        }, PERFORMANCE_THRESHOLDS.LOBBY_CONNECTION);
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
        }, PERFORMANCE_THRESHOLDS.LOBBY_RECONNECTION);
    });
});

afterEach(async () => {
    await Promise.all(activeClients.map((client) => client.disconnectLobby()));
    activeClients.length = 0;
    server?.stop(true);
});
