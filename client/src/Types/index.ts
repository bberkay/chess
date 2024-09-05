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

export type WsMessage = [WsCommand, any];