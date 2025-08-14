import { GetReqScheme, GetRoutes, PostReqScheme, PostRoutes } from "./scheme";
import { ApiServiceError } from "./ApiServiceError";

/**
 * A utility class for performing typed HTTP GET and POST requests.
 * Handles URL construction, query param formatting, and error wrapping.
 */
export class ApiService {
    /**
     * Constructs a full URL from the server base URL, route, optional path params, and query params.
     *
     * @param serverUrl - The base server URL (e.g., "http://localhost:3000").
     * @param route - The route string (e.g., "/check-lobby").
     * @param pathParams - Optional path parameters to append to the URL.
     * @param queryParams - Optional query parameters to append as a query string.
     * @returns The fully constructed and encoded URL.
     * @throws ApiServiceError if URL construction fails.
     */
    static _createUrl(
        serverUrl: string,
        route: string,
        pathParams?: Record<string, string> | null,
        queryParams?: Record<string, string> | null,
    ): string {
        try {
            let queryString = serverUrl + route;

            if (pathParams) {
                queryString += "/" + Object.values(pathParams).join("/");
            }

            if (queryParams) {
                queryString +=
                    "?" +
                    new URLSearchParams(queryParams).toString();
            }

            return encodeURI(queryString);
        } catch (e: unknown) {
            throw ApiServiceError.factory.RequestUrlConstructFailed(
                e instanceof Error ? (e as Error).message : "",
            );
        }
    }

    /**
     * Sends a simple GET request to the `/hello` endpoint.
     *
     * @param serverUrl - The base server URL.
     * @returns A typed response object from the `/hello` route.
     */
    static async hello(
        serverUrl: string,
    ): Promise<GetReqScheme[GetRoutes.Hello]["response"]> {
        const response = await fetch(
            ApiService._createUrl(serverUrl, GetRoutes.Hello),
        );
        const data = await response.json();
        return data;
    }

    /**
     * Sends a typed GET request to the specified route with optional path and query parameters.
     *
     * @typeParam T - A valid GET route from the GetRoutes enum.
     * @param endpoint - The GET route to hit.
     * @param pathParams - Parameters to insert into the route path.
     * @param queryParams - Parameters to include as a query string.
     * @returns The response typed to match the endpoint.
     * @throws ApiServiceError if the GET request fails.
     */
    static async get<T extends GetRoutes>(
        endpoint: T,
        pathParams: GetReqScheme[T]["request"]["pathParams"],
        queryParams: GetReqScheme[T]["request"]["queryParams"],
    ): Promise<GetReqScheme[T]["response"]> {
        const getUrl = ApiService._createUrl(
            import.meta.env.VITE_SERVER_URL!,
            endpoint,
            pathParams,
            queryParams,
        );

        try {
            const response = await fetch(getUrl);
            const data = await response.json();
            return data;
        } catch (e: unknown) {
            throw ApiServiceError.factory.GetRequestFailed(
                e instanceof Error ? (e as Error).message : "",
            );
        }
    }

    /**
     * Sends a typed POST request to the specified route with optional path parameters and request body.
     *
     * @typeParam T - A valid POST route from the PostRoutes enum.
     * @param endpoint - The POST route to hit.
     * @param pathParams - Parameters to insert into the route path.
     * @param body - The body to send with the request, can be JSON or FormData.
     * @returns The response typed to match the endpoint.
     * @throws ApiServiceError if the POST request fails.
     */
    static async post<T extends PostRoutes>(
        endpoint: T,
        pathParams: PostReqScheme[T]["request"]["pathParams"],
        body: PostReqScheme[T]["request"]["body"],
    ): Promise<PostReqScheme[T]["response"]> {
        const postUrl = ApiService._createUrl(
            import.meta.env.VITE_SERVER_URL!,
            endpoint,
            pathParams,
        );

        try {
            const response = await fetch(postUrl, {
                method: "POST",
                headers:
                    body instanceof FormData
                        ? {}
                        : { "Content-Type": "application/json" },
                body:
                    body instanceof FormData
                        ? body
                        : JSON.stringify(body),
            });

            const data = await response.json();
            return data;
        } catch (e: unknown) {
            throw ApiServiceError.factory.PostRequestFailed(
                e instanceof Error ? (e as Error).message : "",
            );
        }
    }
}
