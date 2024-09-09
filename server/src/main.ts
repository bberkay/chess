/**
 * @name Chess
 * @description Server side of the chess application.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess
 * @license MIT
 */

/** 
 * ********* Websocket Connection Rules ***********
 * 
 * Creating Lobby:
 * ws://localhost:3000?playerName=Player1
 * lobbyId and userToken will be created randomly by server
 * and sent to client with connected WsCommand. Example:
 * CONNECTED JSON.stringify({
 *  "lobbyId":"123456",
 *  "userToken":"123456", 
 *  "color":"White", 
 *  "playerName":"Player1"
 * })
 * 
 * Connection to the lobby:
 * ws://localhost:3000?playerName=Player1&lobbyId=123456
 * userToken will be created randomly by server and sent to 
 * client with connected WsCommand.
 *
 * Reconneting to the lobby:
 * ws://localhost:3000?userToken=123456&lobbyId=123456 
 * playerName will be taken from the server by userToken
 * and sent to client with connected WsCommand.
 * Note: playerName will be taken from the server 
 * by userToken for preventing the user to reconnect
 * lobby with different playerName.
 * 
 * *************************************************
 */

import type { Server } from "bun";
import { LobbyManager } from "./Classes/LobbyManager";
import type { WebSocketData, Player, Color } from "./Types";
import { WsCommand } from "./Classes/WsCommand";
import { createUserToken, isOriginAllowed, areParametersValid } from "./Classes/Helper";
import { MAX_PAYLOAD_LENGTH } from "./Consts";

/**
 * Handle the player name process. This contains creating a new lobby 
 * or joining an existing lobby.
 */
function handlePlayerNameProcess(lobbyId: string | null): Response | { lobbyId: string, userToken: string } 
{
    if(!lobbyId)
        lobbyId = LobbyManager.createLobby();
    else{
        const lobby = LobbyManager.getLobby(lobbyId)!;
        if(lobby.isGameReadyToStart())
            return new Response("Lobby is full.", {status: 400});
    }

    return { lobbyId, userToken: createUserToken() };
}

/**
 * Handle the user token process. This contains reconnecting 
 * to the lobby.
 */
function handleUserTokenProcess(lobbyId: string, userToken: string | null): Response | { lobbyId: string, playerName: string } 
{
    const lobby = LobbyManager.getLobby(lobbyId!)!;
    const playerName = lobby.getPlayerNameByToken(userToken!);
    if(!playerName)
        return new Response("Invalid user token.", {status: 401});
    if(lobby.isPlayerOnlineByToken(userToken!))
        return new Response("User is already online.", {status: 400});

    return { lobbyId, playerName };
}

const server = Bun.serve<WebSocketData>({
    port: 3000,
    fetch(req: Request, server: Server) {
        if(isOriginAllowed(req))
            return new Response("Invalid origin.", {status: 403});

        const url = new URL(req.url);
        let playerName = url.searchParams.get("playerName");
        let lobbyId = url.searchParams.get("lobbyId");
        let userToken = url.searchParams.get("userToken");
        
        const parameterValidation = areParametersValid(playerName, lobbyId, userToken)
        if(parameterValidation instanceof Response)
            return parameterValidation;

        if(lobbyId && !LobbyManager.isLobbyExist(lobbyId))
            return new Response("Lobby not found.", {status: 404});

        if(playerName){
            const handleResponse = handlePlayerNameProcess(lobbyId);
            if(handleResponse instanceof Response)
                return handleResponse;
            ({ lobbyId, userToken } = handleResponse);
        }
        else{
            const handleResponse = handleUserTokenProcess(lobbyId!, userToken);
            if(handleResponse instanceof Response)
                return handleResponse;
            ({ lobbyId, playerName } = handleResponse);
        }

        const success = server.upgrade(req, { data: { playerName: playerName, lobbyId: lobbyId, userToken: userToken } });
        if(success) return;

        return new Response("Invalid request.", {status: 400});
    },
    websocket: {
        open(ws: Player) {
            if(LobbyManager.joinLobby(ws)){
                const lobbyId = ws.data.lobbyId;
                const lobby = LobbyManager.getLobby(lobbyId)!;
                const color = lobby.getPlayerColor(ws)!;
                const playerName = lobby.getPlayerName(ws)!;
                ws.subscribe(lobbyId);
                ws.send(WsCommand.connected(ws.data));
                console.log("Connection opened: ", lobbyId, color, playerName);

                if(lobby.isGameReadyToStart()){
                    lobby.startGame();
                    server.publish(lobbyId, WsCommand.started(lobbyId, lobby.getBoard()));
                    console.log("Game started: ", lobbyId);
                }
            }
        },
        message(ws: Player, message: string) {
            ws.send(`You said: ${message}`);
        },
        close(ws: Player) {
            const lobbyId = ws.data.lobbyId;
            if(LobbyManager.isLobbyExist(lobbyId)){
                const lobby = LobbyManager.getLobby(lobbyId)!;
                const color = lobby.getPlayerColor(ws);
                LobbyManager.leaveLobby(ws);
                ws.send(WsCommand.disconnected(lobbyId, color!));
                ws.unsubscribe(lobbyId);
                console.log("Connection closed: ", lobbyId, color);
            }
        },
        maxPayloadLength: MAX_PAYLOAD_LENGTH,
        idleTimeout: 60000, // This is going to be game timeout(1+0, 3+0, 5+0 etc.)
    }
});
  
console.log(`Listening on http://localhost:${server.port} ...`);