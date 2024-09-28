import { Color, JsonNotation, Square, Durations } from "@Chess/Types";
import type { Player } from "../Types";

/**
 * WebSocket command types.
 */
export enum WsCommandTitle {
    Connected="CONNECTED",
    Started="STARTED",
    Disconnected="DISCONNECTED",
    Reconnected="RECONNECTED",
    Moved="MOVED",
    Error="ERROR",
};

/**
 * Base type for the WebSocket 
 * data interfaces.
 */
export interface WsData{ }

/**
 * WsConnectedData interface for the 
 * connected command to send to the client
 * or receive from the client.
 */
export interface WsConnectedData extends WsData{
    lobbyId: string,
    player: Player
}

/**
 * WsStartedData interface for the
 * started command to send to the client
 * or receive from the client.
 */
export interface WsStartedData extends WsData{
    whitePlayer: {
        name: string, 
        isOnline: boolean
    }, 
    blackPlayer: {
        name: string, 
        isOnline: boolean
    }, 
    board: string | JsonNotation,
    durations: Durations
}

/**
 * WsMovedData interface for the
 * moved command to send to the client
 * or receive from the client.
 */
export interface WsMovedData extends WsData{
    from: Square,
    to: Square
}

/**
 * WsDisconnectedData interface for the
 * disconnected command to send to the client
 * or receive from the client.
 */
export interface WsDisconnectedData extends WsData{
    lobbyId: string,
    disconnectedPlayer: {
        name: string, 
        color: Color
    }
}

/**
 * WsReconnectedData interface for the
 * reconnected command to send to the client
 * or receive from the client.
 */
export interface WsReconnectedData extends WsData{
    lobbyId: string,
    reconnectedPlayer: {
        name: string,
        color: Color
    }
}

/**
 * WsErrorData interface for the
 * error command to send to the client
 * or receive from the client.
 */
export interface WsErrorData extends WsData{
    message: string
}


/**
 * This class is used to create WebSocket commands
 * to send to the client.
 */
export class WsCommand{
    /**
     * Create a WebSocket command with the given command and data.
     */
    private static _wsCommand(command: WsCommandTitle, data: WsData): string {
        if(Object.values(WsCommandTitle).indexOf(command) === -1) 
            throw new Error("Invalid command.");

        return command + " " +  JSON.stringify(data);
    }

    /**
     * Send connected command to the client.
     * @example CONNECTED {lobbyId: "1234", ...}
     */
    static connected(connectedData: WsConnectedData): string {
        return this._wsCommand(WsCommandTitle.Connected, connectedData);
    }

    /**
     * Send started command to the client.
     * @example STARTED {board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", ...}
     */
    static started(startedData: WsStartedData): string 
    {
        return this._wsCommand(WsCommandTitle.Started, startedData);
    }

    /**
     * Send moved command to the client.
     * @example MOVED {from: Square.a2, to: Square.a4}
     */
    static moved(moveData: WsMovedData): string 
    {
        return this._wsCommand(WsCommandTitle.Moved, moveData);
    }

    /**
     * Send disconnected command to the client.
     * @example DISCONNECTED {lobbyId: "1234", player: {name: "Player1", color: "white"}}
     */
    static disconnected(disconnectedData: WsDisconnectedData): string 
    {
        return this._wsCommand(WsCommandTitle.Disconnected, disconnectedData);
    }

    /**
     * Send reconnected command to the client.
     * @example RECONNECTED {lobbyId: "1234", player: {name: "Player1", color: "white"}}
     */
    static reconnected(reconnectData: WsReconnectedData): string 
    {
        return this._wsCommand(WsCommandTitle.Reconnected, reconnectData);
    }
    
    /**
     * Send error command to the client.
     * @example ERROR {message: "Invalid move."}
     */
    static error(errorData: WsErrorData): string
    {
        return this._wsCommand(WsCommandTitle.Error, errorData);
    }

    /**
     * Parse the websocket message.
     * @param message JSON.stringify([WsCommandTitle, any])
     * @example [Moved, {from: Square.a2, to: Square.a4}]
     */
    static parse(message: string): [WsCommandTitle, WsData] {
        return JSON.parse(message);
    }
}