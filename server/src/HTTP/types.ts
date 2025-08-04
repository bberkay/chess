import { Player } from "src/Player";

/**
 * Defines the available HTTP API routes that can be used by
 * the clients as GET requests.
 */
export enum HTTPGetRoutes {
    Root = "/",
    Health = "/health",
    CheckLobby = "/check-lobby/:lobbyId",
}

/**
 * Defines the available HTTP API routes that can be used by
 * the clients as POST requests.
 */
export enum HTTPPostRoutes {
    CreateLobby = "/create-lobby",
    ConnectLobby = "/connect-lobby",
    ReconnectLobby = "/reconnect-lobby",
}

/**
 * Defines the expected POST request bodies for each HTTP route.
 */
export interface HTTPPostBody {
    [HTTPPostRoutes.CreateLobby]: {
        name: string;
        board: string;
        remaining: number;
        increment: number;
    };
    [HTTPPostRoutes.ConnectLobby]: {
        name: string;
        lobbyId: string;
    };
    [HTTPPostRoutes.ReconnectLobby]: {
        lobbyId: string;
        playerToken: string;
    };
}

/**
 * Defines the expected response data for each HTTP route.
 */
export interface HTTPResponseData {
    [HTTPGetRoutes.Root]: null;
    [HTTPGetRoutes.Health]: null;
    [HTTPGetRoutes.CheckLobby]: boolean;
    [HTTPPostRoutes.CreateLobby]: { lobbyId: string; player: Player };
    [HTTPPostRoutes.ConnectLobby]: HTTPResponseData[HTTPPostRoutes.CreateLobby];
    [HTTPPostRoutes.ReconnectLobby]: HTTPResponseData[HTTPPostRoutes.CreateLobby];
}
