import { WebSocketHandlerError } from "./WebSocketHandlerError";
import { WebSocketValidatorError } from "./WebSocketValidatorError";
import { WsCommand } from "./WsCommand";
import { WsCommandError } from "./WsCommandError";
import { WsTitle } from "./types";
import { containsSuspiciousPattern } from "@Utils";

/**
 * Normalizes any thrown value into a known WebSocket error type.
 *
 * - If the thrown value is already a `WebSocketHandlerError` or
 *   `WebSocketValidatorError`, it is re-thrown as is.
 * - Otherwise, the value is wrapped in a generic
 *   `UnexpectedErrorWhileHandlingWebSocket`.
 *
 * This ensures that only expected, standardized error types propagate
 * through the WebSocket layer.
 *
 * @param e - The error or unknown value caught during WebSocket handling.
 * @throws {WebSocketHandlerError | WebSocketValidatorError}
 */
export function normalizeWebSocketError(e: unknown): never {
    if (
        e instanceof WebSocketHandlerError ||
        e instanceof WebSocketValidatorError
    ) {
        throw e;
    } else {
        throw WebSocketHandlerError.factory.UnexpectedErrorWhileHandlingWebSocket();
    }
}

/**
 * Creates a standardized WebSocket error message command from an error that occurs
 * during the handling or validation of a WebSocket operation.
 *
 * - If the error is an instance of `WebSocketValidatorError` or
 *   `WebSocketHandlerError`, the message will contain the error's details.
 * - For all other error types (unexpected/internal errors), the message will
 *   fall back to the provided operation's message.
 *
 * The returned message is wrapped in a `WsCommand` with the title `WsTitle.Error`,
 * ensuring clients always receive errors in a consistent format that can be
 * distinguished from other WebSocket commands.
 *
 * @param e - The thrown error, which may or may not be a known WebSocket validation/handler error.
 * @param operation - The WebSocket operation context, used as a fallback for the error message.
 * @returns A JSON string representing a `WsCommand` with the `Error` title and a descriptive message.
 */
export function createMessageFromWebSocketError(
    e: unknown,
    operation: WebSocketHandlerError | WebSocketValidatorError,
): string {
    return WsCommand.create([
        WsTitle.Error,
        {
            message:
                e instanceof WebSocketValidatorError ||
                e instanceof WebSocketHandlerError ||
                e instanceof WsCommandError
                    ? e.message
                    : operation.message,
        },
    ]);
}

/**
 * Recursively validates that the given payload object (including all nested objects and arrays)
 * does not contain any suspicious keys or values that may indicate XSS or code injection attempts.
 *
 * @param obj - The payload object to validate (may contain nested objects/arrays).
 * @throws {WebSocketValidatorError} If the payload contains potentially malicious content.
 */
export function assertNoMaliciousContent(obj: unknown): void {
    const walk = (value: unknown): void => {
        if (typeof value === "string") {
            if (containsSuspiciousPattern(value)) {
                throw WebSocketValidatorError.factory.InvalidPayload();
            }
        } else if (Array.isArray(value)) {
            for (const item of value) {
                walk(item);
            }
        } else if (value && typeof value === "object") {
            for (const [key, val] of Object.entries(value)) {
                if (containsSuspiciousPattern(key)) {
                    throw WebSocketValidatorError.factory.InvalidPayload();
                }
                walk(val);
            }
        }
    };

    walk(obj);
}
