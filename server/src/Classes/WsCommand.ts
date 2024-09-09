import { Color } from "../Types";

enum WsCommandTitle {
    Connected="CONNECTED",
    Started="STARTED",
    Disconnected="DISCONNECTED"
};

export class WsCommand{
    private static _wsCommand(command: WsCommandTitle, data: any): string {
        if(Object.values(WsCommandTitle).indexOf(command) === -1) throw new Error("Invalid command.");
        return command + " " +  JSON.stringify(data);
    }

    static connected(connectedResponseData: {lobbyId: string, color: Color}): string {
        return this._wsCommand(WsCommandTitle.Connected, connectedResponseData);
    }

    static started(startedResponseData: {lobbyId: string, data: any}): string {
        return this._wsCommand(WsCommandTitle.Started, startedResponseData);
    }

    static disconnected(disconnectedResponseData: {lobbyId: string, color: Color}): string {
        return this._wsCommand(WsCommandTitle.Disconnected, disconnectedResponseData);
    }
}