import type { Player } from "../Types";

/**
 * WebSocket command types.
 */
enum WsCommandTitle {
    Connected="CONNECTED",
    Started="STARTED",
    Disconnected="DISCONNECTED"
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
        if(Object.values(WsCommandTitle).indexOf(command) === -1) throw new Error("Invalid command.");
        return command + " " +  JSON.stringify(data);
    }

    /**
     * Send connected command to the client.
     * @example CONNECTED {color: "white", name: "Player1"}
     */
    static connected(player: Player): string {
        return this._wsCommand(WsCommandTitle.Connected, player);
    }

    /**
     * Send started command to the client.
     * @example STARTED {whitePlayerName: "Player1", blackPlayerName: "Player2", board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", duration: [5, 0]}
     */
    static started(startedData: any): string {
        return this._wsCommand(WsCommandTitle.Started, startedData);
    }

    /**
     * Send disconnected command to the client.
     * @example DISCONNECTED {color: "white", name: "Player1"}
     */
    static disconnected(player: Player): string {
        return this._wsCommand(WsCommandTitle.Disconnected, player);
    }
}