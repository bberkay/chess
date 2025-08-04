import { removeFalsyParamsAndEmptyLists } from "@Utils/Url";
import { SERVER_ADDRESS } from "@ChessPlatform/Consts";
import { Player } from "@ChessPlatform/Types";

export enum GetRoutes {
    HELLO = "/hello",
    CHECK_LOBBY = "/check-lobby",
}

export enum PostRoutes {
    CREATE_LOBBY = "/create-lobby",
    CONNECT_LOBBY = "/connect-lobby",
    RECONNECT_LOBBY = "/reconnect-lobby"
}

export interface GetQueryParams {
    [GetRoutes.HELLO]: null,
    [GetRoutes.CHECK_LOBBY]: {
        pathParams: {
            lobbyId: string;
        }
    };
}

export interface PostQueryParams {
    [PostRoutes.CREATE_LOBBY]: null,
    [PostRoutes.CONNECT_LOBBY]: null,
    [PostRoutes.RECONNECT_LOBBY]: null,
}

export interface PostBody {
    [PostRoutes.CREATE_LOBBY]: {
        name: string;
        board: string;
        remaining: number;
        increment: number;
    };
    [PostRoutes.CONNECT_LOBBY]: {
        name: string;
        lobbyId: string;
    };
    [PostRoutes.RECONNECT_LOBBY]: {
        lobbyId: string;
        playerToken: string;
    };
}

export interface BaseResponse {
    success: boolean;
    message: string;
}

export interface GetQueryResponse {
    [GetRoutes.HELLO]: null;
    [GetRoutes.CHECK_LOBBY]: boolean;
}

export interface PostQueryResponse {
    [PostRoutes.CREATE_LOBBY]: {
        lobbyId: string;
        player: Player;
    },
    [PostRoutes.CONNECT_LOBBY]: PostQueryResponse[PostRoutes.CREATE_LOBBY],
    [PostRoutes.RECONNECT_LOBBY]: PostQueryResponse[PostRoutes.CREATE_LOBBY]
}

export interface GetResponse<T extends GetRoutes> extends BaseResponse {
    data?: GetQueryResponse[T];
}

export interface PostResponse<T extends PostRoutes = PostRoutes> extends BaseResponse {
    data?: T extends keyof PostQueryResponse ? PostQueryResponse[T] : undefined;
}

// TODO: Improve ApiService
export class ApiService {
    static _createQueryString(params: any): string {
        let queryString = "";

        if (params && Object.hasOwn(params, "pathParams") && params.pathParams)
            queryString += "/" + Object.values(params.pathParams).join("/");

        if (params && Object.hasOwn(params, "queryParams") && params.queryParams)
            queryString +=
                    "?" +
                    new URLSearchParams(
                        removeFalsyParamsAndEmptyLists(params.queryParams),
                    ).toString();

        return encodeURI(queryString);
    }

    static createGetQueryString<T extends GetRoutes>(params: GetQueryParams[T]): string {
        return ApiService._createQueryString(params);
    }

    static createPostQueryString<T extends PostRoutes>(params: PostQueryParams[T]): string {
        return ApiService._createQueryString(params);
    }

    static async hello(serverUrl: string): Promise<GetResponse<GetRoutes.HELLO>> {
        const response = await fetch(serverUrl + GetRoutes.HELLO);
        const data = await response.json();
        return data
    }

    static async get<T extends GetRoutes>(
        endpoint: T,
        params?: GetQueryParams[T],
    ): Promise<GetResponse<T>> {
        const queryString = params ? ApiService.createGetQueryString(params) : "";
        const response = await fetch(SERVER_ADDRESS + endpoint + queryString);
        const data = await response.json();
        return data
    }

    static async post<T extends PostRoutes>(
        endpoint: T,
        body: PostBody[T],
        params?: PostQueryParams[T]
    ): Promise<PostResponse<T>> {
        const queryString = params ? ApiService.createPostQueryString(params) : "";
        const response = await fetch(SERVER_ADDRESS + endpoint + queryString, {
            method: "POST",
            headers:
                body instanceof FormData
                    ? {}
                    : { "Content-Type": "application/json" },
            body:
                body instanceof FormData
                    ? body
                    : JSON.stringify(removeFalsyParamsAndEmptyLists(body)),
        });

        const data = await response.json();
        return data
    }
}
