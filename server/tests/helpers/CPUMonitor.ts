import os from "os";
import { Monitor } from "./Monitor";

const CORES = os.cpus().length;

export interface CPUStatistics {
    "CPU Time (ms)": number;
    "CPU Utilization (%)": number;
    "CPU Time per Request (ms)": number;
}

export class CPUMonitor extends Monitor {
    protected _concurrency: number | null = null;
    private _startCpu: NodeJS.CpuUsage | null = null;
    private _endCpu: NodeJS.CpuUsage | null = null;

    constructor() {
        super();
    }

    public start(concurrency: number) {
        this._concurrency = concurrency;
        this._startCpu = process.cpuUsage();
    }

    public end() {
        if (!this._startCpu) throw new Error("Could not get CPUMonitor statictics, please use CPUMonitor.start() first.");
        this._endCpu = process.cpuUsage(this._startCpu);
    }

    protected _reset() {
        this._startCpu = null;
        this._endCpu = null;
        this._concurrency = null;
    }

    public get(totalTimeMs: number): CPUStatistics {
        if (!this._endCpu) throw new Error("Could not get CPUMonitor statictics, please use CPUMonitor.end() first.");
        const cpuTimeMs = (this._endCpu.user + this._endCpu.system) / 1000;
        const cpuPercent = (cpuTimeMs / (totalTimeMs * CORES)) * 100;
        const cpuMsPerReq = cpuTimeMs / this._concurrency!;

        this._reset();

        return {
            "CPU Time (ms)": cpuTimeMs,
            "CPU Utilization (%)": cpuPercent,
            "CPU Time per Request (ms)": cpuMsPerReq,
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public validate(cpuStatistics: CPUStatistics, concurrency: number): void {

    }
}
