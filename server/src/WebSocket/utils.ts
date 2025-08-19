import { CORSResponse, HTTPGetRoutes } from "@HTTP";
import { WebSocketHandlerError } from "./WebSocketHandlerError";
import { WebSocketValidatorError } from "./WebSocketValidatorError";
import { WsCommand } from "./WsCommand";
import { WsTitle } from "./types";

/**
 * Creates a standardized CORSResponse object from an error that occurs during
 * the handling or validation of a WebSocket operation.
 *
 * - If the error is an instance of `WebSocketValidatorError` or
 *   `WebSocketHandlerError`, the response will contain the error's message
 *   and a `400 Bad Request` status code.
 * - For all other error types (unexpected/internal errors), the response will
 *   contain the provided operation's message and a `500 Internal Server Error`
 *   status code.
 *
 * This function ensures that clients always receive a consistent error
 * response format, regardless of the error source, when dealing with
 * WebSocket-related requests.
 *
 * @param e - The thrown error, which may or may not be a known WebSocket validation/handler error.
 * @param operation - The WebSocket operation context, used as a fallback for the response message.
 * @returns A `CORSResponse` containing the error message and appropriate HTTP status code.
 */
export function createResponseFromWebSocketError(
    e: unknown,
    operation: WebSocketHandlerError | WebSocketValidatorError,
): CORSResponse<HTTPGetRoutes.Root> {
    return new CORSResponse(
        {
            success: false,
            message:
                e instanceof WebSocketValidatorError ||
                e instanceof WebSocketHandlerError
                    ? e.message
                    : operation.message,
        },
        {
            status:
                e instanceof WebSocketValidatorError ||
                e instanceof WebSocketHandlerError
                    ? 400
                    : 500,
        },
    );
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
                e instanceof WebSocketValidatorError || e instanceof WebSocketHandlerError
                    ? e.message
                    : operation.message,
        },
    ]);
}
