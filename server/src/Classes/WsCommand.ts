import { Color, JsonNotation, Square, GameStatus } from "@Chess/Types";
import type { Player } from "../Types";

/**
 * WebSocket command types.
 */
export enum WsTitle {
    Created="CREATED",
    Connected="CONNECTED",
    Started="STARTED",
    Finished="FINISHED",
    Disconnected="DISCONNECTED",
    Reconnected="RECONNECTED",
    Moved="MOVED",
    Aborted="ABORTED",
    Resigned="RESIGNED",
    DrawOffered="DRAW_OFFERED",
    DrawAccepted="DRAW_ACCEPTED",
    UndoOffered="UNDO_OFFERED",
    UndoAccepted="UNDO_ACCEPTED",
    PlayAgainOffered="PLAY_AGAIN_OFFERED",
    PlayAgainAccepted="PLAY_AGAIN_ACCEPTED",
    OfferCancelled="OFFER_CANCELLED",
    SentOfferCancelled="SENT_OFFER_CANCELLED",
    SentOfferDeclined="SENT_OFFER_DECLINED",
    Error="ERROR",
};

/**
 * WsCreatedData interface for the 
 * created command to send to the client.
 */
export interface WsCreatedData{
    lobbyId: string,
    player: Player
}

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
    game: string | JsonNotation
}

/**
 * WsFinishedData interface for the
 * finished command to send to the client.
 */
export interface WsFinishedData{
    gameStatus: GameStatus
}

/**
 * WsResignedData interface for the
 * resigned command to send to the client.
 */
export interface WsResignedData{
    gameStatus: GameStatus
}

/**
 * WsUndoData interface for the
 * undo command to send to the client.
 */
export interface WsUndoData{
    undoColor: Color,
    board: string
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
    color: Color
}

/**
 * WsReconnectedData interface for the
 * reconnected command to send to the client.
 */
export interface WsReconnectedData{
    lobbyId: string,
    color: Color
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
export type WsData = WsCreatedData
    | WsConnectedData 
    | WsStartedData 
    | WsFinishedData
    | WsResignedData
    | WsUndoData
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
    private static _wsCommand(title: WsTitle, data: WsData | null = null): string {
        if(Object.values(WsTitle).indexOf(title) === -1) 
            throw new Error("Invalid command.");

        return data ? JSON.stringify([title, data]) : JSON.stringify([title]);
    }

    /**
     * Send created command to the client.
     * @example [Connected, {lobbyId: "1234", player: {name: "Player1", color: "white"}}]
     */
    static created(createdData: WsCreatedData): string {
        return WsCommand._wsCommand(WsTitle.Created, createdData);
    }

    /**
     * Send connected command to the client.
     * @example [Connected, {lobbyId: "1234", player: {name: "Player1", color: "white"}}]
     */
    static connected(connectedData: WsConnectedData): string {
        return WsCommand._wsCommand(WsTitle.Connected, connectedData);
    }

    /**
     * Send started command to the client.
     * @example [STARTED, {board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", ...}]
     */
    static started(startedData: WsStartedData): string 
    {
        return WsCommand._wsCommand(WsTitle.Started, startedData);
    }

    /**
     * Send finished command to the client.
     * @example [FINISHED, {gameStatus: GameStatus.Draw}]
     */
    static finished(finishedData: WsFinishedData): string
    {
        return WsCommand._wsCommand(WsTitle.Finished, finishedData);
    }

    /**
     * Send moved command to the client.
     * @example [MOVED, {from: Square.a2, to: Square.a4}]
     */
    static moved(moveData: WsMovedData): string 
    {
        return WsCommand._wsCommand(WsTitle.Moved, moveData);
    }

    /**
     * Send aborted command to the client.
     */
    static aborted(): string
    {
        return WsCommand._wsCommand(WsTitle.Aborted);
    }

    /**
     * Send resigned command to the client.
     */
    static resigned(resignedData: WsResignedData): string
    {
        return WsCommand._wsCommand(WsTitle.Resigned, resignedData);
    }

    /**
     * Send draw accepted command to the client.
     * @example [DRAW_ACCEPTED]
     */
    static drawAccepted(): string
    {
        return WsCommand._wsCommand(WsTitle.DrawAccepted);
    }

    /**
     * Send undo accepted command to the client.
     * @example [UNDO_ACCEPTED, {board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", ...}]
     */
    static undoAccepted(undoData: WsUndoData): string
    {
        return WsCommand._wsCommand(WsTitle.UndoAccepted, undoData);
    }
    
    /**
     * Send draw offered command to the client.
     */
    static drawOffered(): string
    {
        return WsCommand._wsCommand(WsTitle.DrawOffered);
    }

    /**
     * Send undo offered command to the client.
     */
    static undoOffered(): string
    {
        return WsCommand._wsCommand(WsTitle.UndoOffered);
    }
    
    /**
     * Send play again offered command to the server.
     */
    static playAgainOffered(): string
    {
        return WsCommand._wsCommand(WsTitle.PlayAgainOffered);
    }

    /**
     * Send sent offer cancelled command to the client.
     */
    static sentOfferCancelled(): string
    {
        return WsCommand._wsCommand(WsTitle.SentOfferCancelled);
    }

    /**
     * Send offer declined command to the client.
     */
    static sentOfferDeclined(): string
    {
        return WsCommand._wsCommand(WsTitle.SentOfferDeclined);
    }

    /**
     * Send disconnected command to the client.
     * @example [DISCONNECTED, {lobbyId: "1234", player: {name: "Player1", color: "white"}}]
     */
    static disconnected(disconnectedData: WsDisconnectedData): string 
    {
        return WsCommand._wsCommand(WsTitle.Disconnected, disconnectedData);
    }

    /**
     * Send reconnected command to the client.
     * @example [RECONNECTED, {lobbyId: "1234", player: {name: "Player1", color: "white"}}]
     */
    static reconnected(reconnectData: WsReconnectedData): string 
    {
        return WsCommand._wsCommand(WsTitle.Reconnected, reconnectData);
    }
    
    /**
     * Send error command to the client.
     * @example [ERROR, {message: "Invalid move."}]
     */
    static error(errorData: WsErrorData): string
    {
        return WsCommand._wsCommand(WsTitle.Error, errorData);
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