
/**
 * Check if the given value's length is equal to the given length.
 */
export function isValidLength(value: string, length: number): boolean {
    return value.length === length;
}

/**
 * Check if the given value is in the given range.
 */
export function isInRange(value: number, min: number, max: number): boolean {
    return !isNaN(value) && value >= min && value <= max;
}
