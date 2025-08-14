/**
 * A constant object that contains template functions for generating
 * error messages related to player registry failures.
 */
export const PlayerRegistryErrorTemplates = {
    /**
     * Indicates that a player token could not be generated.
     */
    PlayerTokenNotCreated: () =>
        `Player token could not created`,

    /**
     * Indicates that a player ID could not be generated.
     */
    PlayerIdNotCreated: () =>
        `Player id could not created.`,
} as const;

/**
 * Utility type that maps each error template to a factory function
 * returning a `PlayerRegistryError` instance.
 */
type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => PlayerRegistryError
        : never;
};

/**
 * Union type of valid player registry error template keys.
 */
type PlayerRegistryErrorTemplate = keyof typeof PlayerRegistryErrorTemplates;

/**
 * A custom error class used to represent errors occurring in the player registry,
 * such as token or ID generation failures.
 */
export class PlayerRegistryError extends Error {
    /**
     * Key representing the specific error template used.
     */
    public readonly key: PlayerRegistryErrorTemplate;

    /**
     * Private constructor to enforce controlled error creation via the static factory.
     *
     * @param key - A key from the error template indicating the type of error.
     * @param message - A human-readable error message.
     */
    private constructor(key: PlayerRegistryErrorTemplate, message: string) {
        super(message);
        this.name = "PlayerRegistryError";
        this.key = key;
    }

    /**
     * A static factory object used to create `PlayerRegistryError` instances
     * based on predefined error templates.
     *
     * ### Example:
     * ```ts
     * throw PlayerRegistryError.factory.PlayerIdNotCreated();
     * ```
     */
    public static readonly factory = Object.fromEntries(
        Object.entries(PlayerRegistryErrorTemplates).map(([key, template]) => {
            return [
                key,
                (...args: unknown[]) =>
                    new PlayerRegistryError(
                        key as PlayerRegistryErrorTemplate,
                        (template as (...args: unknown[]) => string)(...args),
                    ),
            ];
        }),
    ) as ErrorFactory<typeof PlayerRegistryErrorTemplates>;
}
