import { Player } from "@ChessPlatform/Types";

export interface ReqResponse<T> {
    success: boolean;
    message: string;
    data: T
}

export enum GetRoutes {
    Hello = "/hello",
    CheckLobby = "/check-lobby"
}

export enum PostRoutes {
    CreateLobby = "/create-lobby",
    ConnectLobby = "/connect-lobby",
    ReconnectLobby = "/reconnect-lobby"
}

export interface GetReqScheme {
    [GetRoutes.Hello]: {
        request: {
            pathParams: null,
            queryParams: null,
        }
        response: ReqResponse<null>,
    },
    [GetRoutes.CheckLobby]: {
        request: {
            pathParams: { lobbyId: string },
            queryParams: null,
        }
        response: ReqResponse<boolean>,
    }
}

export interface PostReqScheme {
    [PostRoutes.CreateLobby]: {
        request: {
            pathParams: null,
            body: {
                name: string;
                board: string;
                remaining: number;
                increment: number;
            },
        }
        response: ReqResponse<{
            lobbyId: string;
            player: Player;
        }>,
    },
    [PostRoutes.ConnectLobby]: {
        request: {
            pathParams: null,
            body: {
                name: string;
                lobbyId: string;
            };
        }
        response: ReqResponse<{
            lobbyId: string;
            player: Player;
        }>,
    },
    [PostRoutes.ReconnectLobby]: {
        request: {
            pathParams: null,
            body: {
                lobbyId: string;
                playerToken: string;
            };
        }
        response: ReqResponse<{
            lobbyId: string;
            player: Player;
        }>,
    }
}
