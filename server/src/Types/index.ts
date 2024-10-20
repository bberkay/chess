import type { ServerWebSocket } from "bun";

/**
 * Player interface for the player data.
 */
export interface Player{
    id: string;
    name: string;
    isOnline: boolean;
    token: string;
}

/**
 * Parameters required to create a new lobby.
 */
export interface CreateLobbyReqParams{
    name: string;
    board: string;
    remaining: string;
    increment: string;
} 

/**
 * Parameters required to join an existing lobby.
 */
export interface JoinLobbyReqParams{
    name: string;
    lobbyId: string;
}

/**
 * Parameters required to reconnect to an existing lobby.
 */
export interface ReconnectLobbyReqParams{
    lobbyId: string;
    token: string;
}

/**
 * Base interface that combines all WebSocket request parameter types.
 * This can be used when a type needs to potentially include all properties from the various request types.
 */
export interface BaseWebSocketReqParams extends CreateLobbyReqParams, JoinLobbyReqParams, ReconnectLobbyReqParams {}

/**
 * Union type representing all possible WebSocket request parameter types.
 * This can be used when a function or method can accept any one of these request types.
 */
export type WebSocketReqParams = CreateLobbyReqParams | JoinLobbyReqParams | ReconnectLobbyReqParams;

/**
 * Represents the data associated with a WebSocket connection.
 */
export interface WebSocketData{
    lobbyId: string;
    player: Player;
    board: string;
    totalTime: string;
    incrementTime: string;
}

/**
 * Custom type for a ServerWebSocket with WebSocketData.
 * This combines the Bun ServerWebSocket type with our custom WebSocketData interface.
 */
export type RWebSocket = ServerWebSocket<WebSocketData>;
