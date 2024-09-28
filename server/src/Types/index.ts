import type { ServerWebSocket } from "bun";
import type { Color } from "@Chess/Types";

export type Player = {
    name: string;
    color: Color;
    isOnline: boolean;
    userToken: string;
}

export type WebSocketParams = { 
    name: string | null,
    lobbyId: string | null,
    userToken: string | null,
    board: string | null,
    remaining: string | number | null,
    increment: string | number | null,
} 

export type WebSocketData = {
    lobbyId: string;
    player: Player;
    board: string;
    totalTime: string;
    incrementTime: string;
}

export type RWebSocket = ServerWebSocket<WebSocketData>;
