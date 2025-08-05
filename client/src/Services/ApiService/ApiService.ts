import { removeFalsyParamsAndEmptyLists } from "@Utils";
import { SERVER_ADDRESS } from "@ChessPlatform/Consts";
import { GetReqScheme, GetRoutes, PostReqScheme, PostRoutes } from "./scheme";
import { ApiServiceError } from "./ApiServiceError";

export class ApiService {
    static _createUrl(
        serverUrl: string,
        route: string,
        pathParams?: Record<string, unknown> | null,
        queryParams?: Record<string, unknown> | null,
    ): string {
        try {
            let queryString = serverUrl + route;

            if (pathParams) {
                queryString += "/" + Object.values(pathParams).join("/");
            }

            if (queryParams) {
                queryString +=
                    "?" +
                    new URLSearchParams(
                        removeFalsyParamsAndEmptyLists(queryParams),
                    ).toString();
            }

            return encodeURI(queryString);
        } catch (e: unknown) {
            throw ApiServiceError.factory.RequestUrlConstructFailed(e instanceof Error ? (e as Error).message : "");
        }
    }

    static async hello(
        serverUrl: string,
    ): Promise<GetReqScheme[GetRoutes.Hello]["response"]> {
        const response = await fetch(ApiService._createUrl(serverUrl, GetRoutes.Hello));
        const data = await response.json();
        return data;
    }

    static async get<T extends GetRoutes>(
        endpoint: T,
        pathParams: GetReqScheme[T]["request"]["pathParams"],
        queryParams: GetReqScheme[T]["request"]["queryParams"],
    ): Promise<GetReqScheme[T]["response"]> {
        const getUrl = ApiService._createUrl(
            SERVER_ADDRESS,
            endpoint,
            pathParams,
            queryParams,
        );

        try {
            const response = await fetch(getUrl);
            const data = await response.json();
            return data;
        } catch (e: unknown) {
            throw ApiServiceError.factory.GetRequestFailed(e instanceof Error ? (e as Error).message : "");
        }
    }

    static async post<T extends PostRoutes>(
        endpoint: T,
        pathParams: PostReqScheme[T]["request"]["pathParams"],
        body: PostReqScheme[T]["request"]["body"],
    ): Promise<PostReqScheme[T]["response"]> {
        const postUrl = ApiService._createUrl(SERVER_ADDRESS, endpoint, pathParams);

        try {
            const response = await fetch(
                postUrl,
                {
                    method: "POST",
                    headers:
                        body instanceof FormData
                            ? {}
                            : { "Content-Type": "application/json" },
                    body:
                        body instanceof FormData
                            ? body
                            : JSON.stringify(removeFalsyParamsAndEmptyLists(body)),
                },
            );

            const data = await response.json();
            return data;
        } catch (e: unknown) {
            throw ApiServiceError.factory.PostRequestFailed(e instanceof Error ? (e as Error).message : "");
        }
    }
}
