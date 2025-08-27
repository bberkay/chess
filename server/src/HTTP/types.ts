import { Player } from "@Player";

/**
 * Defines the available HTTP API routes that can be used by
 * the clients as POST requests.
 */
export enum HTTPRoutes {
    Root = "/",
    Health = "/health",
    CheckLobby = "/check-lobby/:lobbyId",
    CreateLobby = "/create-lobby",
    ConnectLobby = "/connect-lobby",
    ReconnectLobby = "/reconnect-lobby",
}

/**
 * Defines the expected POST request bodies for each HTTP route.
 */
export interface HTTPPostBody {
    [HTTPRoutes.CreateLobby]: {
        name: string;
        board: string;
        remaining: number;
        increment: number;
    };
    [HTTPRoutes.ConnectLobby]: {
        name: string;
        lobbyId: string;
    };
    [HTTPRoutes.ReconnectLobby]: {
        lobbyId: string;
        playerToken: string;
    };
}

/**
 * Defines the expected response data for each HTTP route.
 */
export interface HTTPResponseData {
    [HTTPRoutes.Root]: null;
    [HTTPRoutes.Health]: null;
    [HTTPRoutes.CheckLobby]: boolean;
    [HTTPRoutes.CreateLobby]: { lobbyId: string; player: Player };
    [HTTPRoutes.ConnectLobby]: HTTPResponseData[HTTPRoutes.CreateLobby];
    [HTTPRoutes.ReconnectLobby]: HTTPResponseData[HTTPRoutes.CreateLobby];
}
