import { median } from "@Utils";
import { Monitor } from "./Monitor";

export interface MEMStatistics {
    "Heap (MB)": number;
    "Median Heap (MB)": number;
    "Median RSS (MB)": number;
}

interface MEMUsage {
    heapUsed: number;
    heapTotal: number;
    rss: number;
}

export class MEMMonitor extends Monitor {
    protected _concurrency: number | null = null;
    private _startMem: MEMUsage | null = null;
    private _endMem: MEMUsage | null = null;
    private _samplesMem: Array<MEMUsage> = [];
    private _samplerMem: NodeJS.Timeout | null = null;

    constructor() {
        super();
    }

    private _snapshotMemory(): MEMUsage {
        const mem = process.memoryUsage();
        return {
            heapUsed: mem.heapUsed,
            heapTotal: mem.heapTotal,
            rss: mem.rss,
        };
    }

    public start(concurrency: number) {
        this._concurrency = concurrency;
        this._startMem = this._snapshotMemory();
        this._samplerMem = setInterval(
            () => this._samplesMem.push(this._snapshotMemory()),
            50,
        );
    }

    public end() {
        if (!this._startMem) throw new Error("Could not get MEMMonitor statictics, please use MEMMonitor.start() first.");
        this._endMem = this._snapshotMemory();
        clearInterval(this._samplerMem!);
    }

    protected _reset() {
        this._startMem = null;
        this._endMem = null;
        this._samplesMem = [];
        this._samplerMem = null;
        this._concurrency = null;
    }

    public get(): MEMStatistics {
        if (!this._endMem) throw new Error("Could not get MEMMonitor statictics, please use MEMMonitor.end() first.");
        this._samplesMem.push(this._endMem);
        const heapMB = (this._endMem.heapUsed - this._startMem!.heapUsed) / 1024 / 1024;
        const medianHeapMB =
            median(this._samplesMem.map((samp) => samp.heapUsed)) / 1024 / 1024;
        const medianRSSMB =
            median(this._samplesMem.map((samp) => samp.rss)) / 1024 / 1024;

        this._reset();

        return {
            "Heap (MB)": heapMB,
            "Median Heap (MB)": medianHeapMB,
            "Median RSS (MB)": medianRSSMB,
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public validate(memStatistics: MEMStatistics): void {

    }
}
