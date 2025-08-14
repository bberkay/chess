import {
    GU_ID_LENGTH,
    MAX_FEN_LENGTH,
    MAX_INCREMENT_TIME,
    MAX_PLAYER_NAME_LENGTH,
    MAX_REMAINING_TIME,
    MIN_INCREMENT_TIME,
    MIN_PLAYER_NAME_LENGTH,
    MIN_REMAINING_TIME,
} from "@Consts";

/**
 * A constant object holding factory functions for constructing
 * standardized HTTP request validation error messages.
 */
export const HTTPRequestErrorTemplates = {
    InvalidRoute: (route: string) =>
        `Invalid request. Given route ${route} is not implemented.`,
    InvalidLobbyIdLength: () =>
        `Invalid request. "lobbyId" length must be ${GU_ID_LENGTH} length.`,
    InvalidNameLength: () =>
        `Invalid request. "name" length must be between ${MIN_PLAYER_NAME_LENGTH} and ${MAX_PLAYER_NAME_LENGTH}.`,
    InvalidBoardLength: () =>
        `Invalid request. "board" length must be less than ${MAX_FEN_LENGTH}.`,
    InvalidRemainingValue: () =>
        `Invalid request. "remaining" must be a number between ${MIN_REMAINING_TIME} and ${MAX_REMAINING_TIME}.`,
    InvalidIncrementValue: () =>
        `Invalid request. "increment" must be a number between ${MIN_INCREMENT_TIME} and ${MAX_INCREMENT_TIME}.`,
    InvalidPlayerTokenLength: () =>
        `Invalid request. "playerToken" length must be ${GU_ID_LENGTH}`,
} as const;

/**
 * Utility type for creating a strongly-typed error factory from a given template object.
 */
type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => HTTPRequestValidatorError
        : never;
};

/**
 * Union type of valid error template keys.
 */
type HTTPRequestErrorTemplate = keyof typeof HTTPRequestErrorTemplates;

/**
 * A custom error class for HTTP request validation failures.
 * Each error is associated with a specific validation failure key and message.
 */
export class HTTPRequestValidatorError extends Error {
    /**
     * The key identifying which validation rule the error relates to.
     */
    public readonly key: HTTPRequestErrorTemplate;

    /**
     * Private constructor to force the use of the static factory.
     *
     * @param key - The error key corresponding to the specific validation rule.
     * @param message - The human-readable error message.
     */
    private constructor(key: HTTPRequestErrorTemplate, message: string) {
        super(message);
        this.name = "HTTPRequestValidatorError";
        this.key = key;
    }

    /**
     * A static factory object for constructing `HTTPRequestValidatorError` instances
     * using the defined templates.
     *
     * Example:
     * ```ts
     * throw HTTPRequestValidatorError.factory.InvalidLobbyIdLength();
     * ```
     */
    public static readonly factory = Object.fromEntries(
        Object.entries(HTTPRequestErrorTemplates).map(([key, template]) => {
            return [
                key,
                (...args: unknown[]) =>
                    new HTTPRequestValidatorError(
                        key as HTTPRequestErrorTemplate,
                        (template as (...args: unknown[]) => string)(...args),
                    ),
            ];
        }),
    ) as ErrorFactory<typeof HTTPRequestErrorTemplates>;
}
