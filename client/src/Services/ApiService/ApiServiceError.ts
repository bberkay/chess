const ApiServiceErrorTemplates = {
    RequestUrlConstructFailed: (details: string) => `Failed to construct request URL ${details}`,
    GetRequestFailed: (details: string) => `Failed to complete GET request ${details}`,
    PostRequestFailed: (details: string) => `Failed to complete POST request ${details}`,
} as const;

type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => ApiServiceError
        : never;
};

type ApiServiceErrorTemplate = keyof typeof ApiServiceErrorTemplates;

export class ApiServiceError extends Error {
    public readonly key: ApiServiceErrorTemplate;

    private constructor(key: ApiServiceErrorTemplate, message: string) {
        super(message);
        this.name = "ApiServiceError";
        this.key = key;
    }

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
