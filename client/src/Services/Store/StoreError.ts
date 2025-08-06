/**
 * Templates for store-related error messages.
 */
const StoreErrorTemplates = {
    /**
     * Error message template for invalid store keys.
     * @param key - The invalid key attempted to be used.
     */
    InvalidStoreKey: (key: string) => `Given store key ${key} is doesn't defined in Store.`,
} as const;

/**
 * Factory type mapping error keys to error constructors.
 */
type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => StoreError
        : never;
};

/**
 * Enum keys of defined Store error templates.
 */
type StoreErrorTemplate = keyof typeof StoreErrorTemplates;

/**
 * Custom error class for Store-specific errors.
 * Supports error factory methods to create typed error instances.
 */
export class StoreError extends Error {
    /**
     * The error key identifying the type of error.
     */
    public readonly key: StoreErrorTemplate;

    /**
     * Private constructor to enforce usage of factory methods.
     *
     * @param key - The error key.
     * @param message - The error message.
     */
    private constructor(key: StoreErrorTemplate, message: string) {
        super(message);
        this.name = "StoreError";
        this.key = key;
    }

    /**
     * Factory methods to create StoreError instances from templates.
     */
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
