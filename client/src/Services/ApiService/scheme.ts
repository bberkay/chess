import { Player } from "@ChessPlatform/Types";

/**
 * A generic interface for standardized API responses.
 *
 * @template T - The type of the response data payload.
 */
export interface ReqResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

/**
 * Enumeration of all available HTTP GET routes in the API.
 */
export enum GetRoutes {
    Hello = "/hello",
    CheckLobby = "/check-lobby",
}

/**
 * Enumeration of all available HTTP POST routes in the API.
 */
export enum PostRoutes {
    CreateLobby = "/create-lobby",
    ConnectLobby = "/connect-lobby",
    ReconnectLobby = "/reconnect-lobby",
}

/**
 * Describes the expected request and response shape
 * for each GET route in the application.
 */
// TODO: Create validation for GetReqScheme and PostReqScheme
export interface GetReqScheme {
    [GetRoutes.Hello]: {
        request: {
            pathParams: null;
            queryParams: null;
        };
        response: ReqResponse<null>;
    };

    [GetRoutes.CheckLobby]: {
        request: {
            pathParams: { lobbyId: string };
            queryParams: null;
        };
        response: ReqResponse<boolean>;
    };
}

/**
 * Describes the expected request and response shape
 * for each POST route in the application.
 */
export interface PostReqScheme {
    [PostRoutes.CreateLobby]: {
        request: {
            pathParams: null;
            body: {
                name: string;
                board: string;
                remaining: number;
                increment: number;
            };
        };
        response: ReqResponse<{
            lobbyId: string;
            player: Player;
        }>;
    };

    [PostRoutes.ConnectLobby]: {
        request: {
            pathParams: null;
            body: {
                name: string;
                lobbyId: string;
            };
        };
        response: ReqResponse<{
            lobbyId: string;
            player: Player;
        }>;
    };

    [PostRoutes.ReconnectLobby]: {
        request: {
            pathParams: null;
            body: {
                lobbyId: string;
                playerToken: string;
            };
        };
        response: ReqResponse<{
            lobbyId: string;
            player: Player;
        }>;
    };
}
