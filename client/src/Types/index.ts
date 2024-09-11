/**
 * WsCommand enum for the types of commands that can be
 * received from the WebSocket.
 * @see src/Platform/Platform.ts
 */
export enum WsCommand {
    Connected="CONNECTED",
    Started="STARTED",
    Disconnected="DISCONNECTED"
};

/**
 * WsMessage type for the command and data that can be
 * received from the WebSocket.
 * @see src/Platform/Platform.ts
 */
export type WsMessage = [WsCommand, any];

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