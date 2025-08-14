/**
 * Templates for LobbyRegistry error messages.
 */
export const LobbyRegistryErrorTemplates = {
    LobbyIdNotCreated: () => `Lobby id could not created.`,
} as const;

/**
 * Utility type for creating error factory functions
 * based on given error message templates.
 */
type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => LobbyRegistryError
        : never;
};

/**
 * Union type of all possible LobbyRegistry error keys.
 */
type LobbyRegistryErrorTemplate = keyof typeof LobbyRegistryErrorTemplates;

/**
 * Represents errors related to LobbyRegistry operations.
 *
 * Instances are created via the static factory methods
 * corresponding to specific error cases.
 */
export class LobbyRegistryError extends Error {
    /**
     * Key identifying the specific error type.
     */
    public readonly key: LobbyRegistryErrorTemplate;

    /**
     * Private constructor to enforce use of factory methods.
     *
     * @param key - Error key indicating the error type.
     * @param message - Detailed error message.
     */
    private constructor(key: LobbyRegistryErrorTemplate, message: string) {
        super(message);
        this.name = "LobbyRegistryError";
        this.key = key;
    }

    /**
     * Factory object with methods to create specific LobbyRegistryError instances.
     */
    public static readonly factory = Object.fromEntries(
        Object.entries(LobbyRegistryErrorTemplates).map(([key, template]) => {
            return [
                key,
                (...args: unknown[]) =>
                    new LobbyRegistryError(
                        key as LobbyRegistryErrorTemplate,
                        (template as (...args: unknown[]) => string)(...args),
                    ),
            ];
        }),
    ) as ErrorFactory<typeof LobbyRegistryErrorTemplates>;
}
