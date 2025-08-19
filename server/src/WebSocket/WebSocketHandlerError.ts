/**
 * A constant object holding template functions for generating
 * error messages related to WebSocket handling failures.
 */
export const WebSocketHandlerErrorTemplates = {
    UnexpectedErrorWhileHandlingWebSocket: () =>
        `An error occurred while handling the websocket url.`,
    UnexpectedErrorWhileJoiningLobby: () =>
        `An unexpected error occurred while joining lobby.`,
    UnexpectedErrorWhileLeavingLobby: () =>
        `An unexpected error occurred while leaving lobby.`,
    UnexpectedErrorWhileHandlingCommand: (message: string) =>
        `An unexpected error occurred while handling "${message}" command.`,
    LobbyNotFound: (lobbyId: string) =>
        `Lobby with id "${lobbyId}" was not found.`,
    PlayerNotInLobby: (lobbyId: string, playerToken: string) =>
        `Player with token "${playerToken} is not a part of the lobby with id "${lobbyId}"`,
    AbortGameFailed: (lobbyId: string, playerToken: string) =>
        `Player with token "${playerToken} could not aborted game in lobby with id "${lobbyId}"`,
    ResignFromGameFailed: (lobbyId: string, playerToken: string) =>
        `Player with token "${playerToken}" failed to resign in lobby with id "${lobbyId}".`,
    PlayMoveFailed: (
        lobbyId: string,
        playerToken: string,
        from: number,
        to: number,
    ) =>
        `Player with token "${playerToken}" failed to make move from "${from}" to "${to}" in lobby with id "${lobbyId}".`,
    UndoOfferFailed: (lobbyId: string, playerToken: string) =>
        `Player with token "${playerToken}" could not offer undo in lobby with id "${lobbyId}".`,
    DrawOfferFailed: (lobbyId: string, playerToken: string) =>
        `Player with token "${playerToken}" could not offer draw in lobby with id "${lobbyId}".`,
    PlayAgainOfferFailed: (lobbyId: string, playerToken: string) =>
        `Player with token "${playerToken}" could not offer play again in lobby with id "${lobbyId}".`,
    PlayAgainAcceptFailed: (lobbyId: string, playerToken: string) =>
        `Player with token "${playerToken}" could not accept play again offer in lobby with id "${lobbyId}".`,
    DrawAcceptFailed: (lobbyId: string, playerToken: string) =>
        `Player with token "${playerToken}" could not accept draw offer in lobby with id "${lobbyId}".`,
    UndoAcceptFailed: (lobbyId: string, playerToken: string) =>
        `Player with token "${playerToken}" could not accept undo offer in lobby with id "${lobbyId}".`,
    OfferCancelFailed: (lobbyId: string, playerToken: string) =>
        `Player with token "${playerToken}" could not cancel the active offer in lobby with id "${lobbyId}".`,
    OfferDeclineFailed: (lobbyId: string, playerToken: string) =>
        `Player with token "${playerToken}" could not decline the active offer in lobby with id "${lobbyId}".`,
    FinishGameFailed: (lobbyId: string) =>
        `Failed to finish the game in lobby with id "${lobbyId}".`,
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
type WebSocketHandlerErrorTemplate =
    keyof typeof WebSocketHandlerErrorTemplates;

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
        Object.entries(WebSocketHandlerErrorTemplates).map(
            ([key, template]) => {
                return [
                    key,
                    (...args: unknown[]) =>
                        new WebSocketHandlerError(
                            key as WebSocketHandlerErrorTemplate,
                            (template as (...args: unknown[]) => string)(
                                ...args,
                            ),
                        ),
                ];
            },
        ),
    ) as ErrorFactory<typeof WebSocketHandlerErrorTemplates>;
}
