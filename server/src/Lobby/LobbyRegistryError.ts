const LobbyRegistryErrorTemplates = {
    LobbyIdNotCreated: () => `Lobby id could not created.`,
} as const;

type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => LobbyRegistryError
        : never;
};

type LobbyRegistryErrorTemplate = keyof typeof LobbyRegistryErrorTemplates;

export class LobbyRegistryError extends Error {
    public readonly key: LobbyRegistryErrorTemplate;

    private constructor(key: LobbyRegistryErrorTemplate, message: string) {
        super(message);
        this.name = "LobbyRegistryError";
        this.key = key;
    }

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
