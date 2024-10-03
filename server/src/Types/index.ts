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

export interface CreateLobbyReqParams{
    name: string;
    board: string;
    remaining: string;
    increment: string;
} 

export interface JoinLobbyReqParams{
    name: string;
    lobbyId: string;
}

export interface ReconnectLobbyReqParams{
    lobbyId: string;
    token: string;
}

export interface BaseWebSocketReqParams extends CreateLobbyReqParams, JoinLobbyReqParams, ReconnectLobbyReqParams {}
export type WebSocketReqParams = CreateLobbyReqParams | JoinLobbyReqParams | ReconnectLobbyReqParams;

export interface WebSocketData{
    lobbyId: string;
    player: Player;
    board: string;
    totalTime: string;
    incrementTime: string;
}

export type RWebSocket = ServerWebSocket<WebSocketData>;
