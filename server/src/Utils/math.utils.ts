/**
 * Get factorial of the given number.
 */
export function fact(n: number): number {
    let res = 1;
    for (let i = 1; i <= n; i++) {
        res *= i;
    }
    return res;
}

/**
 * Returns the median value from a numeric array.
 */
export function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
};

/**
 * Returns the p-th percentile (0–1) from a pre-sorted numeric array.
 */
export function percentile(sorted: number[], p: number): number {
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
