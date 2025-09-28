/**
 * Throttles the `func` so it only runs once every `delay` milliseconds.
 * @param func Function to be throttled.
 * @param delay Time to wait before calling the function again.
 */
export function throttle<T extends (...args: any[]) => void>( // eslint-disable-line
    func: T,
    delay: number,
) {
    let inThrottle = false;
    let waitingParams: Parameters<T> | null = null;

    const throttleIndicator = () => {
        if (waitingParams) {
            func(...waitingParams);
            waitingParams = null;
            setTimeout(throttleIndicator, delay);
        } else {
            inThrottle = false;
        }
    };

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(throttleIndicator, delay);
        } else {
            waitingParams = args;
        }
    };
}

/**
 * Debounces the `func` so it only runs after `wait` milliseconds have passed
 * since the last call.
 * @param func Function to be debounced.
 * @param wait Time to wait before calling the function.
 * @returns A function that will call the original function after the wait time.
 */
export function debounce(func: (...args: unknown[]) => void, wait: number) {
    let timeout: number;
    return (...args: unknown[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait) as unknown as number;
    };
}
