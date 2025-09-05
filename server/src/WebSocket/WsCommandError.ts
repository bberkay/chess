import { WsTitle } from "./types";

const ALLOWED_COMMANDS = Object.values(WsTitle).join(", ");

/**
 * A constant object holding template functions for generating
 * error messages related to WebSocket handling failures.
 */
export const WsCommandErrorTemplates = {
    UnexpectedErrorWhileParsingWsCommand: () => `Invalid WebSocket message, the message could not be parsed.`,
    InvalidFormat: () =>
        `Message must be an array in the format: [WsTitle, WsDataMap[WsTitle]?].`,
    InvalidCommand: () =>
        `Invalid WsCommand. Allowed commands: ${ALLOWED_COMMANDS}.`,
} as const;

/**
 * Utility type mapping each error template key to a factory function
 * returning a `WsCommandError` instance.
 */
type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => WsCommandError
        : never;
};

/**
 * Union type of valid error keys in `WsCommandErrorTemplates`.
 */
type WsCommandErrorTemplate =
    keyof typeof WsCommandErrorTemplates;

/**
 * A custom error class representing WebSocket handling errors,
 * such as attempts to reference non-existent players, lobbies,
 * or other runtime issues that occur during message handling.
 */
export class WsCommandError extends Error {
    /**
     * The key of the error template that was used to generate this error.
     */
    public readonly key: WsCommandErrorTemplate;

    /**
     * Private constructor to enforce error instantiation via the static factory.
     *
     * @param key - The error template key.
     * @param message - The generated error message.
     */
    private constructor(key: WsCommandErrorTemplate, message: string) {
        super(message);
        this.name = "WsCommandError";
        this.key = key;
    }

    /**
     * Static factory for creating `WsCommandError` instances
     * based on predefined error templates.
     *
     * Example usage:
     * ```ts
     * throw WsCommandError.factory.NonExistentLobby();
     * ```
     */
    public static readonly factory = Object.fromEntries(
        Object.entries(WsCommandErrorTemplates).map(
            ([key, template]) => {
                return [
                    key,
                    (...args: unknown[]) =>
                        new WsCommandError(
                            key as WsCommandErrorTemplate,
                            (template as (...args: unknown[]) => string)(
                                ...args,
                            ),
                        ),
                ];
            },
        ),
    ) as ErrorFactory<typeof WsCommandErrorTemplates>;
}
