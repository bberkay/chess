import { Color, Durations, GameStatus, JsonNotation, Square } from '@Chess/Types';

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
    Resign = "Resign",
    SendDrawOffer = "SendDrawOffer",
    AcceptDrawOffer = "AcceptDrawOffer",
    SendPlayAgainOffer = "SendPlayAgainOffer",
    AcceptPlayAgainOffer = "AcceptPlayAgainOffer",
    DeclineSentOffer = "DeclineSentOffer",
    CancelOffer = "CancelOffer"
}

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
 * WebSocket command types.
 */
export enum WsTitle {
    Connected="CONNECTED",
    Started="STARTED",
    Finished="FINISHED",
    Disconnected="DISCONNECTED",
    Reconnected="RECONNECTED",
    Moved="MOVED",
    Resigned="RESIGNED",
    DrawOffered="DRAW_OFFERED",
    DrawAccepted="DRAW_ACCEPTED",
    PlayAgainOffered="PLAY_AGAIN_OFFERED",
    PlayAgainAccepted="PLAY_AGAIN_ACCEPTED",
    SentOfferDeclined="SENT_OFFER_DECLINED",
    OfferCancelled="OFFER_CANCELLED",
    SentOfferCancelled="SENT_OFFER_CANCELLED",
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
        id: string,
        name: string, 
        isOnline: boolean
    }, 
    blackPlayer: {
        id: string,
        name: string, 
        isOnline: boolean
    }, 
    game: string | JsonNotation
}

/**
 * WsFinishedData interface for the
 * finished command to receive from the 
 * WebSocket.
 */
export interface WsFinishedData{
    gameStatus: GameStatus,
    isDrawOffered?: boolean
    isResigned?: boolean
    resignColor?: Color
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
    color: Color
}

/**
 * WsReconnectedData interface for the
 * reconnected command to receive from the
 * WebSocket.
 */
export interface WsReconnectedData{
    lobbyId: string,
    color: Color
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
    token: string;
}

/**
 * 
 */
type WebSocketReqParams = CreateLobbyReqParams | JoinLobbyReqParams | ReconnectLobbyReqParams;