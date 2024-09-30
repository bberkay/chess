import type { ServerWebSocket } from "bun";
import type { Color } from "@Chess/Types";

export type Player = {
    name: string;
    color: Color;
    isOnline: boolean;
    userToken: string;
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
    userToken: string;
}

export interface BaseWebSocketReqParams extends CreateLobbyReqParams, JoinLobbyReqParams, ReconnectLobbyReqParams {}
export type WebSocketReqParams = CreateLobbyReqParams | JoinLobbyReqParams | ReconnectLobbyReqParams;

export type WebSocketData = {
    lobbyId: string;
    player: Player;
    board: string;
    totalTime: string;
    incrementTime: string;
}

export type RWebSocket = ServerWebSocket<WebSocketData>;

export const ID_LENGTH = 6;