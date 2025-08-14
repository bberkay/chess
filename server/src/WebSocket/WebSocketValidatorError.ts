import { GU_ID_LENGTH } from "@Consts";

/**
 * A constant object holding template functions for generating
 * error messages related to WebSocket validation failures.
 */
export const WebSocketErrorTemplates = {
    /**
     * Error message when the player token length is invalid.
     * Also implies that the lobby must exist.
     */
    InvalidPlayerTokenLength: () => `Invalid request. "playerToken" length must be ${GU_ID_LENGTH} and lobby must exist.`,

    /**
     * Error message when the lobby ID length is invalid.
     */
    InvalidLobbyIdLength: () => `Invalid request. "lobbyId" length must be ${GU_ID_LENGTH} length.`,
} as const;

/**
 * Utility type mapping each error template key to a factory function
 * returning a `WebSocketValidatorError` instance.
 */
type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => WebSocketValidatorError
        : never;
};

/**
 * Union type of valid error keys in `WebSocketErrorTemplates`.
 */
type WebSocketErrorTemplate = keyof typeof WebSocketErrorTemplates;

/**
 * A custom error class representing WebSocket validation errors,
 * such as invalid player token or lobby ID lengths.
 */
export class WebSocketValidatorError extends Error {
    /**
     * The key of the error template that was used to generate this error.
     */
    public readonly key: WebSocketErrorTemplate;

    /**
     * Private constructor to enforce error instantiation via the static factory.
     *
     * @param key - The error template key.
     * @param message - The generated error message.
     */
    private constructor(key: WebSocketErrorTemplate, message: string) {
        super(message);
        this.name = "WebSocketValidatorError";
        this.key = key;
    }

    /**
     * Static factory for creating `WebSocketValidatorError` instances
     * based on predefined error templates.
     *
     * Example usage:
     * ```ts
     * throw WebSocketValidatorError.factory.InvalidPlayerTokenLength();
     * ```
     */
    public static readonly factory = Object.fromEntries(
        Object.entries(WebSocketErrorTemplates).map(([key, template]) => {
            return [
                key,
                (...args: unknown[]) =>
                    new WebSocketValidatorError(
                        key as WebSocketErrorTemplate,
                        (template as (...args: unknown[]) => string)(...args),
                    ),
            ];
        }),
    ) as ErrorFactory<typeof WebSocketErrorTemplates>;
}
