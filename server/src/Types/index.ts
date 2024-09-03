import type { ServerWebSocket } from "bun";
import { JsonNotation, StartPosition } from '@Chess/Types';

export type WebSocketData = {
    lobbyId: string;
}

export enum Color {
    White="White",
    Black="Black"
}

export type Player = ServerWebSocket<WebSocketData>;

export type Lobby = {
    Players: {
        [Color.White]: Player | null;
        [Color.Black]: Player | null;
    }
    Board: JsonNotation | string;
}