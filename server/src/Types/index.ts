import type { ServerWebSocket } from "bun";

export enum Color {
    White="White",
    Black="Black"
}

export type Player = {
    name: string;
    userToken: string;
    isOnline: boolean;
    color?: Color;
}

export type WebSocketData = {
    lobbyId: string;
    player: Player;
    board: string;
    totalTime: string;
    incrementTime: string;
}

export type RWebSocket = ServerWebSocket<WebSocketData>;