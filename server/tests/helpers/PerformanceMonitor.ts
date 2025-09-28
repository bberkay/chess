import { percentile } from "@Utils";
import { Monitor } from "./Monitor";

export interface PerfStatistics {
    "Avg Latency (ms)": number;
    "p95 Latency (ms)": number;
    "p99 Latency (ms)": number;
    "Max Latency (ms)": number;
    "Min Latency (ms)": number;
    "Std Dev (ms)": number;
    "Total Time (s)": number;
    "Throughput (req/sec)": number;
}

export class PerformanceMonitor extends Monitor {
    protected _concurrency: number | null = null;
    private _startTime: DOMHighResTimeStamp | null = null;
    private _endTime: DOMHighResTimeStamp | null = null;
    private _latencies: number[] = [];

    constructor() {
        super();
    }

    public start(concurrency: number) {
        this._concurrency = concurrency;
        this._startTime = performance.now();
    }

    public end() {
        if (!this._startTime) throw new Error("Could not get PerformanceMonitor statictics, please use PerformanceMonitor.start() first.");
        this._endTime = performance.now();
    }

    protected _reset() {
        this._startTime = null;
        this._endTime = null;
        this._latencies = [];
        this._concurrency = null;
    }

    public async watch<T>(operation: () => Promise<T>) {
        const start = performance.now();
        const result = await operation();
        this._latencies.push(performance.now() - start);
        return result;
    }

    public get(totalTimeMs: number): PerfStatistics {
        if (!this._endTime) throw new Error("Could not get PerformanceMonitor statictics, please use PerformanceMonitor.end() first.");
        this._latencies.sort((a, b) => a - b);
        const avgLatency =
            this._latencies.reduce((sum, val) => sum + val, 0) / this._latencies.length;
        const p95 = percentile(this._latencies, 0.95);
        const p99 = percentile(this._latencies, 0.99);
        const maxLatency = this._latencies[this._latencies.length - 1];
        const minLatency = this._latencies[0];
        const variance =
            this._latencies.reduce(
                (sum, val) => sum + Math.pow(val - avgLatency, 2),
                0,
            ) / this._latencies.length;
        const stdDev = Math.sqrt(variance);

        const totalTimeSec = totalTimeMs / 1000;
        const throughputRPS = this._concurrency! / totalTimeSec;

        this._reset();

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
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public validate(perfStatictics: PerfStatistics): void {

    }
}
