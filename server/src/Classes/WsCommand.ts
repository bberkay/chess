import { JsonNotation, Square } from "@Chess/Types";
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
 * This class is used to create WebSocket commands
 * to send to the client.
 */
export class WsCommand{
    /**
     * Create a WebSocket command with the given command and data.
     */
    private static _wsCommand(command: WsCommandTitle, data: any): string {
        if(Object.values(WsCommandTitle).indexOf(command) === -1) 
            throw new Error("Invalid command.");

        return command + " " +  JSON.stringify(data);
    }

    /**
     * Send connected command to the client.
     * @example CONNECTED {lobbyId: "1234", player: {name: "Player1", userToken: "1234", isOnline: true, color: "white"}}
     */
    static connected(lobbyId: string, player: Player): string {
        return this._wsCommand(WsCommandTitle.Connected, {lobbyId, player});
    }

    /**
     * Send started command to the client.
     * @example STARTED {whitePlayer:{name:"White Player", isOnline:true}, blackPlayer:{name:"Black Player", isOnline: true} board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", duration: [5, 0]}
     */
    static started(
        startedData: {
            whitePlayer: {
                name: string, 
                isOnline: boolean
            }, 
            blackPlayer: {
                name: string, 
                isOnline: boolean
            }, 
            board: string | JsonNotation,
            duration: [number, number]}
    ): string 
    {
        return this._wsCommand(WsCommandTitle.Started, startedData);
    }

    /**
     * Send disconnected command to the client.
     * @example DISCONNECTED {lobbyId: "1234", player: {name: "Player1", color: "white"}}
     */
    static disconnected(
        lobbyId: string, 
        disconnectedPlayerName: string, 
        disconnectedPlayerColor: string
    ): string 
    {
        return this._wsCommand(WsCommandTitle.Disconnected, {
            lobbyId, 
            player: {
                name: disconnectedPlayerName, 
                color: disconnectedPlayerColor
            }
        });
    }

    /**
     * Send reconnected command to the client.
     * @example RECONNECTED {lobbyId: "1234", player: {name: "Player1", color: "white"}}
     */
    static reconnected(
        lobbyId: string, 
        reconnectedPlayerName: string, 
        reconnectedPlayerColor: string
    ): string 
    {
        return this._wsCommand(WsCommandTitle.Reconnected, {
            lobbyId, 
            player: {
                name: reconnectedPlayerName, 
                color: reconnectedPlayerColor
            }
        });
    }

    /**
     * Send moved command to the client.
     * @example MOVED {from: Square.a2, to: Square.a4}
     */
    static moved(from: Square, to: Square): string {
        return this._wsCommand(WsCommandTitle.Moved, {from, to});
    }
    
    /**
     * Send error command to the client.
     * @example ERROR {message: "Invalid move."}
     */
    static error(message: string): string {
        return this._wsCommand(WsCommandTitle.Error, {message});
    }

    /**
     * Parse the websocket message.
     * @param message JSON.stringify([WsCommandTitle, any])
     * @example [Connected, {lobbyId: "1234"}]
     * @example [Started, {lobbyId: "1234", board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"}]
     */
    static parse(message: string): [WsCommandTitle, any] {
        return JSON.parse(message);
    }
}