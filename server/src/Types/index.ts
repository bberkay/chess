import type { ServerWebSocket } from "bun";
import { Color, JsonNotation, Square, GameStatus } from "@Chess/Chess/Types";

/**
 * Player interface for the player data.
 */
export interface Player{
    id: string;
    name: string;
    isOnline: boolean;
    token: string;
}

/**
 * Parameters required to create a new lobby.
 */
export interface CreateLobbyReqParams{
    name: string;
    board: string;
    remaining: string;
    increment: string;
} 

/**
 * Parameters required to join an existing lobby.
 */
export interface JoinLobbyReqParams{
    name: string;
    lobbyId: string;
}

/**
 * Parameters required to reconnect to an existing lobby.
 */
export interface ReconnectLobbyReqParams{
    lobbyId: string;
    token: string;
}

/**
 * Base interface that combines all WebSocket request parameter types.
 * This can be used when a type needs to potentially include all properties from the various request types.
 */
export interface BaseWebSocketReqParams extends CreateLobbyReqParams, JoinLobbyReqParams, ReconnectLobbyReqParams {}

/**
 * Union type representing all possible WebSocket request parameter types.
 * This can be used when a function or method can accept any one of these request types.
 */
export type WebSocketReqParams = CreateLobbyReqParams | JoinLobbyReqParams | ReconnectLobbyReqParams;

/**
 * Represents the data associated with a WebSocket connection.
 */
export interface WebSocketData{
    lobbyId: string;
    player: Player;
    board: string;
    totalTime: string;
    incrementTime: string;
}

/**
 * Custom type for a ServerWebSocket with WebSocketData.
 * This combines the Bun ServerWebSocket type with our custom WebSocketData interface.
 */
export type RWebSocket = ServerWebSocket<WebSocketData>;

/**
 * WebSocket command types.
 */
export enum WsTitle {
    Created = "CREATED",
    Connected = "CONNECTED",
    Started = "STARTED",
    Finished = "FINISHED",
    Disconnected = "DISCONNECTED",
    Reconnected = "RECONNECTED",
    Moved = "MOVED",
    Aborted = "ABORTED",
    Resigned = "RESIGNED",
    DrawOffered = "DRAW_OFFERED",
    DrawAccepted = "DRAW_ACCEPTED",
    UndoOffered = "UNDO_OFFERED",
    UndoAccepted = "UNDO_ACCEPTED",
    PlayAgainOffered = "PLAY_AGAIN_OFFERED",
    PlayAgainAccepted = "PLAY_AGAIN_ACCEPTED",
    OfferCancelled = "OFFER_CANCELLED",
    SentOfferCancelled = "SENT_OFFER_CANCELLED",
    SentOfferDeclined = "SENT_OFFER_DECLINED",
    Error = "ERROR",
}

/**
 * WsCreatedData interface for the
 * created command to send to the client.
 */
export interface WsCreatedData {
    lobbyId: string;
    player: Player;
}

/**
 * WsConnectedData interface for the
 * connected command to send to the client.
 */
export interface WsConnectedData {
    lobbyId: string;
    player: Player;
}

/**
 * WsStartedData interface for the
 * started command to send to the client
 * or receive from the client.
 */
export interface WsStartedData {
    whitePlayer: {
        name: string;
        isOnline: boolean;
    };
    blackPlayer: {
        name: string;
        isOnline: boolean;
    };
    game: string | JsonNotation;
}

/**
 * WsFinishedData interface for the
 * finished command to send to the client.
 */
export interface WsFinishedData {
    gameStatus: GameStatus;
}

/**
 * WsResignedData interface for the
 * resigned command to send to the client.
 */
export interface WsResignedData {
    gameStatus: GameStatus;
}

/**
 * WsUndoData interface for the
 * undo command to send to the client.
 */
export interface WsUndoData {
    undoColor: Color;
    board: string;
}

/**
 * WsMovedData interface for the
 * moved command to send to the client
 * or receive from the client.
 */
export interface WsMovedData {
    from: Square;
    to: Square;
}

/**
 * WsDisconnectedData interface for the
 * disconnected command to send to the client.
 */
export interface WsDisconnectedData {
    lobbyId: string;
    color: Color;
}

/**
 * WsReconnectedData interface for the
 * reconnected command to send to the client.
 */
export interface WsReconnectedData {
    lobbyId: string;
    color: Color;
}

/**
 * WsErrorData interface for the
 * error command to send to the client
 * or receive from the client.
 */
export interface WsErrorData {
    message: string;
}

/**
 * WsDataUnion type for the data that can be
 * received from the WebSocket.
 */
export type WsDataUnion =
    | WsCreatedData
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
 * WsDataMap type that maps each WebSocket command title (WsTitle)
 * to its corresponding data type.
 */
export type WsDataMap = {
    [WsTitle.Created]: WsCreatedData;
    [WsTitle.Connected]: WsConnectedData;
    [WsTitle.Started]: WsStartedData;
    [WsTitle.Finished]: WsFinishedData;
    [WsTitle.Resigned]: WsResignedData;
    [WsTitle.UndoAccepted]: WsUndoData;
    [WsTitle.UndoOffered]: WsUndoData;
    [WsTitle.Moved]: WsMovedData;
    [WsTitle.Reconnected]: WsReconnectedData;
    [WsTitle.Disconnected]: WsDisconnectedData;
    [WsTitle.Error]: WsErrorData;
};

/**
 * WsData type that retrieves the appropriate data type
 * based on the provided WebSocket command title (WsTitle).
 */
export type WsData<T extends WsTitle> = T extends keyof WsDataMap ? WsDataMap[T] : never;

/**
 * WsMessage type for the command and data that can be
 * sent to the client or received from the client.
 * @see src/Platform/Platform.ts
 */
export type WsMessage<T extends WsTitle> = [T, WsData<T>];
