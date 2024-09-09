import type { ServerWebSocket } from "bun";

export type WebSocketData = {
    playerName: string;
    lobbyId: string;
    userToken: string;
    isOnline: boolean;
}

export enum Color {
    White="White",
    Black="Black"
}

export type Player = ServerWebSocket<WebSocketData>;