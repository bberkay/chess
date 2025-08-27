/**
 * A constant object holding factory functions for constructing
 * standardized HTTP request handler error messages.
 */
export const HTTPRequestHandlerErrorTemplates = {
    InternalError: (msg: string) =>
        `An unexpected internal error occurred while handling http request: ${msg}`,
    UnexpectedErrorWhileCheckingLobby: () =>
        `An unexpected error occurred while checking the lobby.`,
    UnexpectedErrorWhileCreatingLobby: () =>
        `An unexpected error occurred while creating the lobby.`,
    UnexpectedErrorWhileConnectingLobby: () =>
        `An unexpected error occurred while connecting to the lobby.`,
    UnexpectedErrorWhileReconnectingLobby: () =>
        `An unexpected error occurred while reconnecting to the lobby.`,
    IpAddressNotFound: () =>
        `IP address could not be found.`,
    RateLimitExceed: () =>
        `Rate limit exceeded. Please try again later.`,
    LobbyNotFound: (lobbyId: string) =>
        `Lobby with id "${lobbyId}" was not found.`,
    LobbyAlreadyStarted: (lobbyId: string) =>
        `Lobby with id "${lobbyId}" has already started.`,
    LobbyFull: (lobbyId: string) =>
        `Lobby with id "${lobbyId}" is already full.`,
    PlayerNotFound: (playerToken: string) =>
        `Player with token "${playerToken}" was not found.`,
    PlayerNotInLobby: (lobbyId: string, playerToken: string) =>
        `Player with token "${playerToken} is not a part of the lobby with id "${lobbyId}"`,
    PlayerAlreadyOnline: (lobbyId: string, playerToken: string) =>
        `Player with token "${playerToken} is already online in the lobby with id "${lobbyId}"`,
} as const;

/**
 * Utility type for creating a strongly-typed error factory from a given template object.
 */
type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => HTTPRequestHandlerError
        : never;
};

/**
 * Union type of valid error template keys.
 */
type HTTPRequestHandlerErrorTemplate = keyof typeof HTTPRequestHandlerErrorTemplates;

/**
 * A custom error class for HTTP request validation failures.
 * Each error is associated with a specific validation failure key and message.
 */
export class HTTPRequestHandlerError extends Error {
    /**
     * The key identifying which validation rule the error relates to.
     */
    public readonly key: HTTPRequestHandlerErrorTemplate;

    /**
     * Private constructor to force the use of the static factory.
     *
     * @param key - The error key corresponding to the specific validation rule.
     * @param message - The human-readable error message.
     */
    private constructor(key: HTTPRequestHandlerErrorTemplate, message: string) {
        super(message);
        this.name = "HTTPRequestHandlerError";
        this.key = key;
    }

    /**
     * A static factory object for constructing `HTTPRequestHandlerError` instances
     * using the defined templates.
     *
     * Example:
     * ```ts
     * throw HTTPRequestHandlerError.factory.InvalidLobbyIdLength();
     * ```
     */
    public static readonly factory = Object.fromEntries(
        Object.entries(HTTPRequestHandlerErrorTemplates).map(([key, template]) => {
            return [
                key,
                (...args: unknown[]) =>
                    new HTTPRequestHandlerError(
                        key as HTTPRequestHandlerErrorTemplate,
                        (template as (...args: unknown[]) => string)(...args),
                    ),
            ];
        }),
    ) as ErrorFactory<typeof HTTPRequestHandlerErrorTemplates>;
}
