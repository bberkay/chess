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

/**
 * Common suspicious patterns and event handler regex used to detect
 * potentially malicious input that could lead to XSS or code injection.
 *
 * SIMPLE_PATTERNS:
 *   - Known dangerous substrings like <script>, <iframe>, eval(), etc.
 * EVENT_HANDLER_REGEX:
 *   - Matches inline event handlers such as onclick=, onerror=, etc.
 */
const SIMPLE_PATTERNS = [
    "javascript:",
    "vbscript:",
    "data:text/html",
    "<script",
    "<iframe",
    "<object",
    "<embed",
    "<link",
    "<meta",
    "eval(",
    "function(",
    "constructor",
    "__proto__",
    "prototype",
];
const EVENT_HANDLER_REGEX = /\bon\w+\s*=/i;

/**
 * Checks whether a given message contains common suspicious substrings
 * or inline event handlers that may indicate potential XSS or code injection attempts.
 */
export function containsSuspiciousPattern(message: string | number | boolean): boolean {
    message = message.toString()
    const lower = message.toLowerCase();
    return SIMPLE_PATTERNS.some(p => lower.includes(p)) ||
           EVENT_HANDLER_REGEX.test(message);
}
