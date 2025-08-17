import { CORSResponse } from "./CORSResponse";
import { HTTPRequestHandlerError } from "./HTTPRequestHandlerError";
import { HTTPRequestValidatorError } from "./HTTPRequestValidatorError";
import { HTTPGetRoutes } from "./types";

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
 * @param operation - The HTTP operation context, used as a fallback for the response message.
 * @returns A `CORSResponse` containing the error message and appropriate HTTP status code.
 */
export function createResponseFromError(
    e: unknown,
    operation: HTTPRequestHandlerError | HTTPRequestValidatorError,
): CORSResponse<HTTPGetRoutes.Root> {
    return new CORSResponse(
        {
            success: false,
            message:
                e instanceof HTTPRequestValidatorError ||
                e instanceof HTTPRequestHandlerError
                    ? e.message
                    : operation.message,
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
