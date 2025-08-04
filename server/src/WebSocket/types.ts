import { Color, GameStatus, JsonNotation, Square } from "@Chess/Types";
import { Lobby } from "@Lobby";
import { ServerWebSocket } from "bun";
import { Player, Players } from "src/Player";

/**
 * Represents the data associated with a WebSocket connection.
 */
export interface WebSocketData {
    lobby: Lobby;
    player: Player;
}

/**
 * Custom type for a ServerWebSocket with WebSocketData.
 * This combines the Bun ServerWebSocket type with our custom WebSocketData interface.
 */
export type RWebSocket = ServerWebSocket<WebSocketData>;

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
 * connected command to send to the client.
 */
export interface WsConnectedData {
    playerId: string;
}

/**
 * WsReconnectedData interface for the
 * connected command to send to the client.
 */
export interface WsReconnectedData {
    color: Color;
}

/**
 * WsDisconnectedData interface for the
 * connected command to send to the client.
 */
export interface WsDisconnectedData {
    color: Color;
}

/**
 * WsStartedData interface for the
 * started command to send to the client
 * or receive from the client.
 */
export interface WsStartedData {
    game: JsonNotation;
    players: Players;
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
 * WsErrorData interface for the
 * error command to send to the client
 * or receive from the client.
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
 *   - If the mapped value is `null`, the message is sent as `[WsTitle]`.
 *   - If the mapped value is an object (including unions like `Type | null`), the message is sent as `[WsTitle, Data]`.
 *
 * - **Incoming messages** (from client to server) use the `WsIncomingMessage` type.
 *   - These always include both `[WsTitle, Data]`, and the `null` is excluded from the data type (`Exclude<T, null>`).
 *   - This ensures the server only parses fully-formed payloads when required.
 *
 * ### Examples:
 * - `[WsTitle.Aborted]` → `null` data, both in and out.
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
 * Represents the structure of a message received over WebSocket.
 *
 * - If the message's associated data is `null`, the message is sent as a single-element tuple: [WsTitle].
 * - Otherwise, the message includes both the title and its payload: [WsTitle, Data].
 *
 * This structure is used to minimize payload size and avoid unnecessary `null` values in messages.
 */
export type WsIncomingMessage = {
    [T in keyof WsDataMap]: null extends WsDataMap[T]
        ? [T]
        : [T, WsDataMap[T]];
}[keyof WsDataMap];

/**
 * Represents the structure of a message being sent over WebSocket.
 *
 * Every message is treated as a tuple of [WsTitle, Data], with `null` types explicitly excluded.
 *
 * This ensures that all messages sent have a guaranteed data payload (if expected),
 * allowing for safe usage without runtime `null` checks.
 */
export type WsOutgoingMessage = {
    [T in keyof WsDataMap]: WsDataMap[T] extends null
        ? [T]
        : [T, Exclude<WsDataMap[T], null>]
}[keyof WsDataMap];
