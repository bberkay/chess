import { PlayerWsData } from "../Types";

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

    static connected(playerWsData: PlayerWsData): string {
        return this._wsCommand(WsCommandTitle.Connected, playerWsData);
    }

    static started(startedData: any): string {
        return this._wsCommand(WsCommandTitle.Started, startedData);
    }

    static disconnected(playerWsData: PlayerWsData): string {
        return this._wsCommand(WsCommandTitle.Disconnected, playerWsData);
    }
}