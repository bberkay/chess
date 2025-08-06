/**
 * A collection of error message templates used by the ApiService class.
 * Each template receives contextual details and returns a human-readable string.
 */
const ApiServiceErrorTemplates = {
    RequestUrlConstructFailed: (details: string) => `Failed to construct request URL ${details}`,
    GetRequestFailed: (details: string) => `Failed to complete GET request ${details}`,
    PostRequestFailed: (details: string) => `Failed to complete POST request ${details}`,
} as const;

/**
 * A mapped type that converts string-generating error templates
 * into a factory that returns typed `ApiServiceError` instances.
 */
type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => ApiServiceError
        : never;
};

/**
 * Union type representing valid ApiServiceError template keys.
 */
type ApiServiceErrorTemplate = keyof typeof ApiServiceErrorTemplates;

/**
 * Custom error class for handling client-side API-related failures.
 * Captures a specific error key and provides a descriptive message.
 */
export class ApiServiceError extends Error {
    /**
     * The key representing the type of API service error.
     */
    public readonly key: ApiServiceErrorTemplate;

    private constructor(key: ApiServiceErrorTemplate, message: string) {
        super(message);
        this.name = "ApiServiceError";
        this.key = key;
    }

    /**
     * A factory object that produces ApiServiceError instances
     * based on predefined error templates.
     *
     * @example
     * ```ts
     * throw ApiServiceError.factory.GetRequestFailed("Timeout after 5s");
     * ```
     */
    public static readonly factory = Object.fromEntries(
        Object.entries(ApiServiceErrorTemplates).map(([key, template]) => {
            return [
                key,
                (...args: unknown[]) =>
                    new ApiServiceError(
                        key as ApiServiceErrorTemplate,
                        (template as (...args: unknown[]) => string)(...args),
                    ),
            ];
        }),
    ) as ErrorFactory<typeof ApiServiceErrorTemplates>;
}
