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
 * ws://localhost:3000?playerName=Player1&board=pppppppprnbqkbnr/8/8/8/8/8/PPPPPPPPRNBQKBNR%20w%20KQkq%20-%200%201&totalTime=5&incrementTime=0
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
import type { PlayerWsData, Player, Color } from "./Types";
import { WsCommand } from "./Classes/WsCommand";
import { createUserToken, isOriginAllowed, areParametersValid } from "./Classes/Helper";
import { MAX_PAYLOAD_LENGTH, SERVER_PORT } from "./Consts";
import { JsonNotation, StartPosition } from "@Chess/Types";

/**
 * Handle the player name process. This contains creating a new lobby 
 * or joining an existing lobby.
 */
function handlePlayerNameProcess(lobbyId: string | null, board: string | JsonNotation | StartPosition, duration: [number, number]): Response | { lobbyId: string, userToken: string }
{
    if(!lobbyId)
        lobbyId = LobbyManager.createLobby(board, duration);
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

/**
 * Join the lobby and start the game if the lobby is ready.
 * Send connected command to the client.
 */
function joinLobby(player: Player){
    if(LobbyManager.joinLobby(player)){
        const lobbyId = player.data.lobbyId;
        const lobby = LobbyManager.getLobby(lobbyId)!;
        const color = lobby.getPlayerColor(player)!;

        player.subscribe(lobbyId);
        player.send(WsCommand.connected(player.data));
        console.log("Connection opened: ", lobbyId, color, player.data.playerName);

        if(lobby.isGameReadyToStart()){
            if(lobby.isGameAlreadyStarted()){
                player.send(WsCommand.started(lobby.getBoard()));
                console.log("Game already started: ", lobbyId);
                return;
            }
            lobby.startGame();
            server.publish(lobbyId, WsCommand.started({
                whitePlayerName: lobby.getWhitePlayerName(),
                blackPlayerName: lobby.getBlackPlayerName(),
                board: lobby.getBoard()
            }));
            console.log("Game started: ", lobbyId);
        }
    }
}

/**
 * Leave the lobby and send disconnected command to the client.
 */
function leaveLobby(player: Player, isDisconnected: boolean = false){
    const lobbyId = player.data.lobbyId;
    const lobby = LobbyManager.getLobby(lobbyId)!;
    const color = lobby.getPlayerColor(player);
    if(!isDisconnected)
        lobby.removePlayer(player);
    else
        lobby.setPlayerOffline(player);
    player.send(WsCommand.disconnected(player.data));
    player.unsubscribe(lobbyId);
    console.log("Connection closed: ", lobbyId, color);
}

/**
 * Server instance.
 */
const server = Bun.serve<PlayerWsData>({
    port: SERVER_PORT,
    fetch(req: Request, server: Server) {
        if(!isOriginAllowed(req))
            return new Response("Invalid origin.", {status: 403});
        
        const parameterValidation = areParametersValid(req);
        if(parameterValidation instanceof Response)
            return parameterValidation;
        
        let { playerName, lobbyId, userToken, board, totalTime, incrementTime } = parameterValidation;

        if(lobbyId && !LobbyManager.isLobbyExist(lobbyId))
            return new Response("Lobby not found.", {status: 404});

        if(playerName){
            const handleResponse = handlePlayerNameProcess(lobbyId, board as string, [parseInt(totalTime!), parseInt(incrementTime!)]);
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
            joinLobby(ws);
        },
        message(ws: Player, message: string) {
            ws.send(`You said: ${message}`);
        },
        close(ws: Player) {
            leaveLobby(ws, true);
        },
        maxPayloadLength: MAX_PAYLOAD_LENGTH,
        idleTimeout: 960,
    }
});
  
console.log(`Listening on http://localhost:${server.port} ...`);