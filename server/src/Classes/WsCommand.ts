import { Color, JsonNotation, Square, Durations, GameStatus } from "@Chess/Types";
import type { Player } from "../Types";

/**
 * WebSocket command types.
 */
export enum WsTitle {
    Connected="CONNECTED",
    Started="STARTED",
    Finished="FINISHED",
    Disconnected="DISCONNECTED",
    Reconnected="RECONNECTED",
    Moved="MOVED",
    Error="ERROR",
};

/**
 * WsConnectedData interface for the 
 * connected command to send to the client.
 */
export interface WsConnectedData{
    lobbyId: string,
    player: Player
}

/**
 * WsStartedData interface for the
 * started command to send to the client
 * or receive from the client.
 */
export interface WsStartedData{
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
 * WsFinishedData interface for the
 * finished command to send to the client.
 */
export interface WsFinishedData{
    gameStatus: GameStatus
}

/**
 * WsMovedData interface for the
 * moved command to send to the client
 * or receive from the client.
 */
export interface WsMovedData{
    from: Square,
    to: Square
}

/**
 * WsDisconnectedData interface for the
 * disconnected command to send to the client.
 */
export interface WsDisconnectedData{
    lobbyId: string,
    disconnectedPlayer: {
        name: string, 
        color: Color
    }
}

/**
 * WsReconnectedData interface for the
 * reconnected command to send to the client.
 */
export interface WsReconnectedData{
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
export interface WsErrorData{
    message: string
}

/**
 * WsData type for the data that can be
 * received from the WebSocket.
 */
export type WsData = WsConnectedData 
    | WsStartedData 
    | WsFinishedData
    | WsMovedData 
    | WsReconnectedData 
    | WsDisconnectedData 
    | WsErrorData;

/**
 * WsMessage type for the command and data that can be
 * sent to the client or received from the client.
 * @see src/Platform/Platform.ts
 */
export type WsMessage = [WsTitle, WsData];

/**
 * This class is used to create WebSocket commands
 * to send to the client.
 */
export class WsCommand{
    /**
     * Create a WebSocket command with the given command and data.
     * @example [Connected, {lobbyId: "1234", ...}]
     */
    private static _wsCommand(title: WsTitle, data: WsData): string {
        if(Object.values(WsTitle).indexOf(title) === -1) 
            throw new Error("Invalid command.");

        return JSON.stringify([title, data]);
    }

    /**
     * Send connected command to the client.
     * @example [Connected, {lobbyId: "1234", player: {name: "Player1", color: "white"}}]
     */
    static connected(connectedData: WsConnectedData): string {
        return this._wsCommand(WsTitle.Connected, connectedData);
    }

    /**
     * Send started command to the client.
     * @example [STARTED, {board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", ...}]
     */
    static started(startedData: WsStartedData): string 
    {
        return this._wsCommand(WsTitle.Started, startedData);
    }

    /**
     * Send finished command to the client.
     * @example [FINISHED, {gameStatus: GameStatus.Draw}]
     */
    static finished(finishedData: WsFinishedData): string
    {
        return this._wsCommand(WsTitle.Finished, finishedData);
    }

    /**
     * Send moved command to the client.
     * @example [MOVED, {from: Square.a2, to: Square.a4}]
     */
    static moved(moveData: WsMovedData): string 
    {
        return this._wsCommand(WsTitle.Moved, moveData);
    }

    /**
     * Send disconnected command to the client.
     * @example [DISCONNECTED, {lobbyId: "1234", player: {name: "Player1", color: "white"}}]
     */
    static disconnected(disconnectedData: WsDisconnectedData): string 
    {
        return this._wsCommand(WsTitle.Disconnected, disconnectedData);
    }

    /**
     * Send reconnected command to the client.
     * @example [RECONNECTED, {lobbyId: "1234", player: {name: "Player1", color: "white"}}]
     */
    static reconnected(reconnectData: WsReconnectedData): string 
    {
        return this._wsCommand(WsTitle.Reconnected, reconnectData);
    }
    
    /**
     * Send error command to the client.
     * @example [ERROR, {message: "Invalid move."}]
     */
    static error(errorData: WsErrorData): string
    {
        return this._wsCommand(WsTitle.Error, errorData);
    }

    /**
     * Parse the that is received from the client.
     * @param message "[Moved, {from: Square.a2, to: Square.a4}]"
     * @example [Moved, {from: Square.a2, to: Square.a4}]
     */
    static parse(message: string): WsMessage {
        return JSON.parse(message);
    }
}