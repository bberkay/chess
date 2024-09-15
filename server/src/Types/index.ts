import type { ServerWebSocket } from "bun";
import type { Color } from "@Chess/Types";

export type Player = {
    name: string;
    color: Color;
    isOnline: boolean;
    userToken: string;
}

export type WebSocketData = {
    lobbyId: string;
    player: Player;
    board: string;
    totalTime: string;
    incrementTime: string;
}

export type RWebSocket = ServerWebSocket<WebSocketData>;
