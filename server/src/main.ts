import type { Server } from "bun";
import { LobbyManager } from "./Classes/LobbyManager";
import type { WebSocketData, Player, Color } from "./Types";

enum WsCommand {
    Connected="CONNECTED",
    Started="STARTED",
    Disconnected="DISCONNECTED"
};

function _ws_command(command: WsCommand, data: any): string {
    if(Object.values(WsCommand).indexOf(command) === -1) throw new Error("Invalid command.");
    console.log(data, typeof data);
    return command + " " + (typeof data === "object" ? JSON.stringify(data) : data);
}

function connected_command(lobbyId: string, color: Color): string {
    return _ws_command(WsCommand.Connected, {lobbyId: lobbyId, color: color});
}

function started_command(lobbyId: string): string {
    return _ws_command(WsCommand.Started, LobbyManager.getBoard(lobbyId));
}

function disconnected_command(lobbyId: string, color: Color): string {
    return _ws_command(WsCommand.Disconnected, {lobbyId: lobbyId, color: color});
}

const server = Bun.serve<WebSocketData>({
    port: 3000,
    fetch(req: Request, server: Server) {
        const url = new URL(req.url);

        let lobbyId = url.pathname.split("/").pop();
        if(!lobbyId) lobbyId = LobbyManager.createLobby();

        const success = server.upgrade(req, { data: { lobbyId }});
        if(success) return;

        return new Response("Invalid request.", {status: 400});
    },
    websocket: {
        open(ws: Player) {
            const lobbyId = ws.data.lobbyId;
            if(LobbyManager.joinLobby(ws)){
                const color = LobbyManager.getPlayerColor(ws)!;
                ws.subscribe(lobbyId);
                ws.send(connected_command(lobbyId, color));
                console.log("Connection opened: ", lobbyId, color);

                if(LobbyManager.isLobbyReady(lobbyId)){
                    LobbyManager.startGame(lobbyId);
                    server.publish(lobbyId, started_command(lobbyId));
                }
            }
        },
        message(ws: Player, message: string) {
            ws.send(`You said: ${message}`);
        },
        close(ws: Player) {
            const lobbyId = ws.data.lobbyId;
            const color = LobbyManager.getPlayerColor(ws);
            LobbyManager.leaveLobby(ws);
            ws.send(disconnected_command(lobbyId, color!));
            ws.unsubscribe(lobbyId);
            console.log("Connection closed: ", lobbyId, color);
        }
    }
});
  
console.log(`Listening on http://localhost:${server.port} ...`);