const LoggerErrorTemplates = {
    LogSavingFailed: (details: string) => `Failed to save log message ${details}`,
    LogEventDispatchFailed: (details: string) => `Failed to dispatching event after saving log message ${details}`,
} as const;

type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => LoggerError
        : never;
};

type LoggerErrorTemplate = keyof typeof LoggerErrorTemplates;

export class LoggerError extends Error {
    public readonly key: LoggerErrorTemplate;

    private constructor(key: LoggerErrorTemplate, message: string) {
        super(message);
        this.name = "LoggerError";
        this.key = key;
    }

    public static readonly factory = Object.fromEntries(
        Object.entries(LoggerErrorTemplates).map(([key, template]) => {
            return [
                key,
                (...args: unknown[]) =>
                    new LoggerError(
                        key as LoggerErrorTemplate,
                        (template as (...args: unknown[]) => string)(...args),
                    ),
            ];
        }),
    ) as ErrorFactory<typeof LoggerErrorTemplates>;
}
