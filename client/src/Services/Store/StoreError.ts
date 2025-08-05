const StoreErrorTemplates = {
    LogSavingFailed: (details: string) => `Failed to save log message ${details}`,
    LogEventDispatchFailed: (details: string) => `Failed to dispatching event after saving log message ${details}`,
} as const;

type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => StoreError
        : never;
};

type StoreErrorTemplate = keyof typeof StoreErrorTemplates;

export class StoreError extends Error {
    public readonly key: StoreErrorTemplate;

    private constructor(key: StoreErrorTemplate, message: string) {
        super(message);
        this.name = "StoreError";
        this.key = key;
    }

    public static readonly factory = Object.fromEntries(
        Object.entries(StoreErrorTemplates).map(([key, template]) => {
            return [
                key,
                (...args: unknown[]) =>
                    new StoreError(
                        key as StoreErrorTemplate,
                        (template as (...args: unknown[]) => string)(...args),
                    ),
            ];
        }),
    ) as ErrorFactory<typeof StoreErrorTemplates>;
}
