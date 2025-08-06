/**
 * Removes all falsy values and empty arrays from the given object.
 *
 * This is useful for cleaning up query or body parameters before sending them in a request.
 * Falsy values (like `null`, `undefined`, `false`, `0`, `""`, etc.) and arrays with no elements
 * will be removed from the final result.
 *
 * @param params - An object containing key-value pairs to clean.
 * @returns A new object containing only truthy values and non-empty arrays, with all values cast to strings.
 *
 * @example
 * removeFalsyParamsAndEmptyLists({ name: "Alice", age: 0, tags: [], role: null })
 * // Returns: { name: "Alice" }
 */
export function removeFalsyParamsAndEmptyLists(
    params: Record<string, any>,
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(params).filter(([_, value]) => {
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            return !!value;
        }),
    );
}

/**
 * Constructs a full URL string from the given parts.
 *
 * Concatenates a root URL, an optional pathname, and an optional object of query parameters
 * into a valid and properly encoded URL string.
 *
 * @param root - The base URL (e.g., "http://localhost:3000").
 * @param pathname - The path segment to append after the root (e.g., "api/users").
 * @param endpoint - An object of query parameters to append to the URL.
 * @returns A fully constructed URL string.
 *
 * @example
 * createURLFromEntries("http://localhost:3000", "api/users", { name: "Alice", active: true })
 * // Returns: "http://localhost:3000/api/users?name=Alice&active=true"
 */
export function createURLFromEntries(root?: string, pathname?: string, endpoint?: Record<string, any>): string {
    let url: string = root || "";
    if (root && !root.endsWith("/")) url += "/";
    if (pathname) url += pathname;
    if (endpoint && !url.endsWith("?")) url += "?";
    if (!endpoint) return url;
    return url + new URLSearchParams(Object.entries(endpoint)).toString();
}

/**
 * Returns the path segment at the specified index from a given URL.
 * Example: ws://localhost:3000/abc/def -> getPathSegment(url, 0) => "abc"
 */
export function getPathSegment(url: string, index: number = 0): string | null {
    try {
        const parsedUrl = new URL(url);
        const segments = parsedUrl.pathname.split("/").filter(Boolean);
        return segments[index] ?? null;
    } catch {
        return null;
    }
}

/**
 * Returns the value of the specified query parameter from a given URL.
 * Example: ws://localhost:3000/abc?userId=567 -> getQueryParam(url, "userId") => "567"
 */
export function getQueryParam(url: string, key: string): string | null {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.searchParams.get(key);
    } catch {
        return null;
    }
}

/**
 * Parses query parameters from a URL and returns them as a typed key-value object.
 * Example: getQueryParams<{ userId: string }>(url) -> { userId: "567" }
 */
export function getQueryParams<T extends Record<string, string>>(url: string): Partial<T> {
    try {
        const parsedUrl = new URL(url);
        const result = {} as Partial<T>;

        for (const [key, value] of parsedUrl.searchParams.entries()) {
            if (key in result) {
                (result as Record<string, string>)[key] = value;
            }
        }

        return result;
    } catch {
        return {};
    }
}
