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
