/**
 * Templates for various Logger errors with detailed messages.
 */
const LoggerErrorTemplates = {
    LogSavingFailed: (details: string) => `Failed to save log message ${details}`,
    LogEventDispatchFailed: (details: string) =>
        `Failed to dispatching event after saving log message ${details}`,
} as const;

/**
 * Factory type mapping error template keys to error constructors.
 */
type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => LoggerError
        : never;
};

/**
 * Enum keys of available Logger error templates.
 */
type LoggerErrorTemplate = keyof typeof LoggerErrorTemplates;

/**
 * Custom Error subclass for Logger-specific errors.
 * Uses error keys to identify error types and factory methods to create errors.
 */
export class LoggerError extends Error {
    /**
     * The key identifying the error type.
     */
    public readonly key: LoggerErrorTemplate;

    /**
     * Private constructor to enforce use of factory methods.
     * @param key - The error key identifying the error type.
     * @param message - Detailed error message.
     */
    private constructor(key: LoggerErrorTemplate, message: string) {
        super(message);
        this.name = "LoggerError";
        this.key = key;
    }

    /**
     * Factory methods to create LoggerError instances based on predefined templates.
     */
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
