import { Color, Durations, GameStatus, JsonNotation, Square } from '@Chess/Types';

/**
 * Player interface for the player data.
 */
export interface Player {
    name: string;
    color: Color;
    isOnline: boolean;
    userToken: string;
}

/**
 * SocketOperation enum for the types 
 * of operations that can be done in/by 
 * the socket.
 * @see src/ChessPlatform.ts
 */
export enum SocketOperation{
    CreateLobby = "CreateLobby",
    JoinLobby = "JoinLobby",
    CancelLobby = "CancelLobby",
}

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
 * connected command to receive from the 
 * WebSocket.
 */
export interface WsConnectedData{
    lobbyId: string,
    player: Player
}

/**
 * WsStartedData interface for the
 * started command to receive from the
 * WebSocket.
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
 * finished command to receive from the 
 * WebSocket.
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
 * disconnected command to receive from the 
 * WebSocket.
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
 * reconnected command to receive from the
 * WebSocket.
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
 * error command to receive from the 
 * WebSocket.
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
 * 
 */
export interface CreateLobbyReqParams{
    name: string;
    board: string;
    remaining: string;
    increment: string;
}

/**
 * 
 */
export interface JoinLobbyReqParams{
    name: string;
    lobbyId: string;
}

/**
 * 
 */
export interface ReconnectLobbyReqParams{
    lobbyId: string;
    userToken: string;
}

/**
 * 
 */
type WebSocketReqParams = CreateLobbyReqParams | JoinLobbyReqParams | ReconnectLobbyReqParams;