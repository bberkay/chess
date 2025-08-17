/**
 * A constant object holding template functions for generating
 * error messages related to WebSocket handling failures.
 */
export const WebSocketHandlerErrorTemplates = {

} as const;

/**
 * Utility type mapping each error template key to a factory function
 * returning a `WebSocketHandlerError` instance.
 */
type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => WebSocketHandlerError
        : never;
};

/**
 * Union type of valid error keys in `WebSocketHandlerErrorTemplates`.
 */
type WebSocketHandlerErrorTemplate = keyof typeof WebSocketHandlerErrorTemplates;

/**
 * A custom error class representing WebSocket handling errors,
 * such as attempts to reference non-existent players, lobbies,
 * or other runtime issues that occur during message handling.
 */
export class WebSocketHandlerError extends Error {
    /**
     * The key of the error template that was used to generate this error.
     */
    public readonly key: WebSocketHandlerErrorTemplate;

    /**
     * Private constructor to enforce error instantiation via the static factory.
     *
     * @param key - The error template key.
     * @param message - The generated error message.
     */
    private constructor(key: WebSocketHandlerErrorTemplate, message: string) {
        super(message);
        this.name = "WebSocketHandlerError";
        this.key = key;
    }

    /**
     * Static factory for creating `WebSocketHandlerError` instances
     * based on predefined error templates.
     *
     * Example usage:
     * ```ts
     * throw WebSocketHandlerError.factory.NonExistentLobby();
     * ```
     */
    public static readonly factory = Object.fromEntries(
        Object.entries(WebSocketHandlerErrorTemplates).map(([key, template]) => {
            return [
                key,
                (...args: unknown[]) =>
                    new WebSocketHandlerError(
                        key as WebSocketHandlerErrorTemplate,
                        (template as (...args: unknown[]) => string)(...args),
                    ),
            ];
        }),
    ) as ErrorFactory<typeof WebSocketHandlerErrorTemplates>;
}
