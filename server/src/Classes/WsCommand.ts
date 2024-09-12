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
     * @example CONNECTED {lobbyId: "1234", player: {name: "Player1", userToken: "1234", isOnline: true, color: "white"}}
     */
    static connected(lobbyId: string, player: Player): string {
        return this._wsCommand(WsCommandTitle.Connected, {lobbyId, player});
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
     * @example DISCONNECTED {lobbyId: "1234", player: {name: "Player1", userToken: "1234", isOnline: true, color: "white"}}
     */
    static disconnected(lobbyId: string, disconnectedPlayerName: string, disconnectedPlayerColor: string): string {
        return this._wsCommand(WsCommandTitle.Disconnected, {lobbyId, player: {name: disconnectedPlayerName, color: disconnectedPlayerColor}});
    }
}