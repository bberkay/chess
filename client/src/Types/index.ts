import { Color, GameStatus, JsonNotation, Square } from "@Chess/Types";

/**
 * SocketOperation enum for the types
 * of operations that can be done in/by
 * the socket.
 * @see src/ChessPlatform.ts
 */
export enum SocketOperation {
    CreateLobby = "CreateLobby",
    JoinLobby = "JoinLobby",
    CancelLobby = "CancelLobby",
    AbortGame = "AbortGame",
    Resign = "Resign",
    SendDrawOffer = "SendDrawOffer",
    SendUndoOffer = "SendUndoOffer",
    AcceptDrawOffer = "AcceptDrawOffer",
    AcceptUndoOffer = "AcceptUndoOffer",
    SendPlayAgainOffer = "SendPlayAgainOffer",
    AcceptPlayAgainOffer = "AcceptPlayAgainOffer",
    DeclineOffer = "DeclineOffer",
    CancelOffer = "CancelOffer",
}

/**
 * SocketEvent enum is used to define the events
 * that are triggered by the ChessPlatform.
 * @enum {string}
 */
export enum SocketEvent {
    /**
     * Triggered when waiting server response
     * to create the lobby.
     * @CustomEvent
     */
    onCreatingLobby = "onCreatingLobby",

    /**
     * Triggered when the lobby is created successfully.
     * @CustomEvent
     * @param {string} lobbyId - The lobby id.
     */
    onLobbyCreated = "onLobbyCreated",

    /**
     * Triggered when waiting server response
     * to join the lobby.
     * @CustomEvent
     * @param {string} lobbyId - The lobby id.
     */
    onJoiningLobby = "onJoiningLobby",

    /**
     * Triggered when the lobby is joined.
     * @Event
     */
    onLobbyJoined = "onLobbyJoined",

    /**
     * Triggered when the lobby is cancelled.
     * @Event
     */
    onLobbyCancelled = "onLobbyCancelled",

    /**
     * Triggered when the active connection is closed.
     * @Event
     */
    onConnectionTerminated = "onConnectionTerminated",
}

/**
 * Represents a player/user.
 */
export interface Player {
    token: string;
    id: string;
    name: string;
    isOnline: boolean;
}

/*
 * Inform players about their opponent.
 * Should not include sensitive information,
 * as it will be shared with both players in the lobby.
 */
export interface Players {
    [Color.White]: Omit<Player, 'token'>;
    [Color.Black]: Omit<Player, 'token'>;
}

/**
 * Enumeration of all WebSocket command titles used in the game protocol.
 */
export enum WsTitle {
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
    OfferDeclined = "OFFER_DECLINED",
    Error = "ERROR",
}

/**
 * WsConnectedData interface for the
 * connected command to receive from the
 * WebSocket.
 */
export interface WsConnectedData {
    playerId: string;
}

/**
 * WsReconnectedData interface for the
 * connected command to receive from the
 * WebSocket.
 */
export interface WsReconnectedData {
    color: Color;
}

/**
 * WsDisconnectedData interface for the
 * connected command to receive from the
 * WebSocket.
 */
export interface WsDisconnectedData {
    color: Color;
}

/**
 * WsStartedData interface for the
 * started command to receive from the
 * WebSocket.
 */
export interface WsStartedData {
    game: JsonNotation;
    players: Players;
}

/**
 * WsFinishedData interface for the
 * finished command to receive from the
 * WebSocket.
 */
export interface WsFinishedData {
    gameStatus: GameStatus;
}

/**
 * WsResignedData interface for the
 * resigned command to receive from the
 * WebSocket.
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
 * WsErrorData interface for the
 * error command to receive from the
 * WebSocket.
 */
export interface WsErrorData {
    message: string;
}

/**
 * Maps each WebSocket command title (WsTitle) to the type of data it carries.
 *
 * This map serves as the central schema for all WebSocket message payloads.
 * It is used to derive both `WsIncomingMessage` and `WsOutgoingMessage` types.
 *
 * ### Message Direction
 * - **Outgoing messages** (from server to client) use the `WsOutgoingMessage` type.
 *   - If the mapped value is `undefined`, the message is sent as `[WsTitle]`.
 *   - If the mapped value is an object (including unions like `Type | undefined`), the message is sent as `[WsTitle, Data]`.
 *
 * - **Incoming messages** (from client to server) use the `WsIncomingMessage` type.
 *   - These always include both `[WsTitle, Data]`, and the `undefined` is excluded from the data type (`Exclude<T, undefined>`).
 *   - This ensures the server only parses fully-formed payloads when required.
 *
 * ### Examples:
 * - `[WsTitle.Aborted]` → `undefined` data, both in and out.
 * - `[WsTitle.Connected, WsConnectedData]` → always with data.
 * - `[WsTitle.Resigned]` (outgoing) → may be sent as `[WsTitle.Resigned]` or `[WsTitle.Resigned, WsResignedData]`.
 *   - When parsed (incoming), `Resigned` must always include a `WsResignedData` payload.
 */
export type WsDataMap = {
    [WsTitle.Connected]: WsConnectedData;
    [WsTitle.Reconnected]: WsReconnectedData;
    [WsTitle.Disconnected]: WsDisconnectedData;
    [WsTitle.Aborted]: null;
    [WsTitle.Started]: WsStartedData;
    [WsTitle.Moved]: WsMovedData;
    [WsTitle.Finished]: WsFinishedData;
    [WsTitle.Resigned]: WsResignedData | null;
    [WsTitle.UndoOffered]: null;
    [WsTitle.UndoAccepted]: WsUndoData | null;
    [WsTitle.DrawOffered]: null;
    [WsTitle.DrawAccepted]: null;
    [WsTitle.PlayAgainOffered]: null;
    [WsTitle.PlayAgainAccepted]: null;
    [WsTitle.OfferCancelled]: null;
    [WsTitle.OfferDeclined]: null;
    [WsTitle.Error]: WsErrorData;
};

/**
 * Represents the structure of a message being sent over WebSocket.
 *
 * - If the message's associated data is `undefined`, the message is sent as a single-element tuple: [WsTitle].
 * - Otherwise, the message includes both the title and its payload: [WsTitle, Data].
 *
 * This structure is used to minimize payload size and avoid unnecessary `undefined` values in messages.
 */
export type WsOutgoingMessage = {
    [T in keyof WsDataMap]: null extends WsDataMap[T]
        ? [T]
        : [T, WsDataMap[T]];
}[keyof WsDataMap];

/**
 * Represents the structure of a message received over WebSocket.
 *
 * Every message is treated as a tuple of [WsTitle, Data], with `undefined` types explicitly excluded.
 *
 * This ensures that all messages received have a guaranteed data payload (if expected),
 * allowing for safe usage without runtime `undefined` checks.
 */
export type WsIncomingMessage = {
    [T in keyof WsDataMap]: WsDataMap[T] extends null
        ? [T]
        : [T, Exclude<WsDataMap[T], null>]
}[keyof WsDataMap];
