const PlayerRegistryErrorTemplates = {
    PlayerTokenNotCreated: () =>
        `Player token could not created`,
    PlayerIdNotCreated: () =>
        `Player id could not created.`,
} as const;

type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => PlayerRegistryError
        : never;
};

type PlayerRegistryErrorTemplate = keyof typeof PlayerRegistryErrorTemplates;

export class PlayerRegistryError extends Error {
    public readonly key: PlayerRegistryErrorTemplate;

    private constructor(key: PlayerRegistryErrorTemplate, message: string) {
        super(message);
        this.name = "PlayerRegistryError";
        this.key = key;
    }

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
