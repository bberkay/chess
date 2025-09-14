export abstract class Monitor {
    protected abstract _concurrency: number | null;
    public abstract start(concurrency: number): void;
    public abstract end(): void;
    protected abstract _reset(): void;
    public abstract get(totalTimeMs: number): unknown;
    public abstract validate(statistics: unknown, concurrency: number, ...args: unknown[]): void;
}
