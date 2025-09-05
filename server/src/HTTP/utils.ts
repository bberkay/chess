import { containsSuspiciousPattern } from "@Utils";
import { CORSResponse } from "./CORSResponse";
import { HTTPRequestHandlerError } from "./HTTPRequestHandlerError";
import { HTTPRequestValidatorError } from "./HTTPRequestValidatorError";
import { HTTPRoutes } from "./types";

/**
 * Creates a standardized CORSResponse object from an error that occurs during
 * the handling or validation of an HTTP request.
 *
 * - If the error is an instance of `HTTPRequestValidatorError` or
 *   `HTTPRequestHandlerError`, the response will contain the error's message
 *   and a `400 Bad Request` status code.
 * - For all other error types (unexpected/internal errors), the response will
 *   contain the provided operation's message and a `500 Internal Server Error`
 *   status code.
 *
 * This function ensures that clients always receive a consistent error
 * response format, regardless of the error source.
 *
 * @param e - The thrown error, which may or may not be a known request/validation error.
 * @param fallbackError - The HTTP operation context, used as a fallback for the response message.
 * @returns A `CORSResponse` containing the error message and appropriate HTTP status code.
 */
export function createResponseFromHTTPError(
    e: unknown,
    fallbackError: HTTPRequestHandlerError | HTTPRequestValidatorError,
): CORSResponse<HTTPRoutes.Root> {
    return new CORSResponse(
        {
            success: false,
            message:
                e instanceof HTTPRequestValidatorError ||
                e instanceof HTTPRequestHandlerError
                    ? e.message
                    : fallbackError.message,
        },
        {
            status:
                e instanceof HTTPRequestValidatorError ||
                e instanceof HTTPRequestHandlerError
                    ? 400
                    : 500,
        },
    );
}

/**
 * Recursively validates that the given payload object (including all nested objects and arrays)
 * does not contain any suspicious keys or values that may indicate XSS or code injection attempts.
 *
 * @param obj - The payload object to validate (may contain nested objects/arrays).
 * @throws {HTTPRequestValidatorError} If the payload contains potentially malicious content.
 */
export function assertNoMaliciousContent(obj: unknown): void {
    const walk = (value: unknown): void => {
        if (typeof value === "string") {
            if (containsSuspiciousPattern(value)) {
                throw HTTPRequestValidatorError.factory.InvalidPayload();
            }
        } else if (Array.isArray(value)) {
            for (const item of value) {
                walk(item);
            }
        } else if (value && typeof value === "object") {
            for (const [key, val] of Object.entries(value)) {
                if (containsSuspiciousPattern(key)) {
                    throw HTTPRequestValidatorError.factory.InvalidPayload();
                }
                walk(val);
            }
        }
    }

    walk(obj);
}
