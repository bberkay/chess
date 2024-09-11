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
 * ws://localhost:3000?name=Player1&board=pppppppprnbqkbnr/8/8/8/8/8/PPPPPPPPRNBQKBNR%20w%20KQkq%20-%200%201&totalTime=5&incrementTime=0
 * lobbyId and userToken will be created randomly by server
 * and sent to client with connected WsCommand. Example:
 * CONNECTED JSON.stringify({
 *  "lobbyId":"123456",
 *  "userToken":"123456", 
 *  "color":"White", 
 *  "name":"Player1"
 * })
 * 
 * Connection to the lobby:
 * ws://localhost:3000?name=Player1&lobbyId=123456
 * userToken will be created randomly by server and sent to 
 * client with connected WsCommand.
 *
 * Reconneting to the lobby:
 * ws://localhost:3000?userToken=123456&lobbyId=123456 
 * name will be taken from the server by userToken
 * and sent to client with connected WsCommand.
 * Note: name will be taken from the server 
 * by userToken for preventing the user to reconnect
 * lobby with different name.
 * 
 * *************************************************
 */

import type { Server, ServerWebSocket } from "bun";
import type { RWebSocket, WebSocketData, Color } from "./Types";
import type { JsonNotation, StartPosition } from "@Chess/Types";
import { LobbyManager } from "./Classes/LobbyManager";
import { WsCommand } from "./Classes/WsCommand";
import { createUserToken } from "./Classes/Helper";
import { MAX_PAYLOAD_LENGTH, SERVER_PORT } from "./Consts";
import { ALLOWED_ORIGINS } from "./Consts";
import { 
    MAX_PLAYER_NAME_LENGTH,
    MIN_PLAYER_NAME_LENGTH,
    MAX_TOTAL_TIME,
    MIN_TOTAL_TIME,
    MAX_INCREMENT_TIME,
    MIN_INCREMENT_TIME
} from "./Consts";

/**
 * Check if the origin is allowed to connect.
 */
function isOriginAllowed(req: Request): boolean {
    const origin = req.headers.get("origin") || "";
    if(!origin) return false;
    return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Check if the parameters are valid.
 */
function areParametersValid(req: Request): Response | { 
    name: string | null, 
    lobbyId: string | null, 
    userToken: string | null, 
    board: string | null, 
    totalTime: string | null, 
    incrementTime: string | null } 
{
    const url = new URL(req.url);
    const name = url.searchParams.get("name");
    const lobbyId = url.searchParams.get("lobbyId");
    const userToken = url.searchParams.get("userToken");
    const board = url.searchParams.get("board");
    const totalTime = url.searchParams.get("totalTime");
    const incrementTime = url.searchParams.get("incrementTime");

    if(name && userToken)
        return new Response(
            "Invalid request. name and userToken cannot be used together.", 
            {status: 400}
        );
    
    if(!name && !userToken)
        return new Response(
            "Invalid request. name or userToken must be provided.", 
            {status: 400}
        );

    if(userToken && !lobbyId)
        return new Response(
            "Invalid request. userToken must be used with lobbyId.", 
            {status: 400}
        );

    if(name && (name.length < MIN_PLAYER_NAME_LENGTH || name.length > MAX_PLAYER_NAME_LENGTH))
        return new Response(
            "Invalid request. playerName length must be between 3 and 25.", 
            {status: 400}
        );

    if(lobbyId && (lobbyId.length < 6 || lobbyId.length > 6))
        return new Response(
            "Invalid request. lobbyId length must be 6.", 
            {status: 400}
        );

    if(userToken && (userToken.length < 6 || userToken.length > 6))
        return new Response(
            "Invalid request. userToken length must be 6.", 
            {status: 400}
        );

    if((board || totalTime || incrementTime) && (!name || lobbyId || userToken))
        return new Response(
            "Invalid request. board, totalTime, incrementTime can only be used when creating a new lobby.", 
            {status: 400}
        );

    if((name && !lobbyId) && (!board || !totalTime || !incrementTime))
        return new Response(
            "Invalid request. board, totalTime, incrementTime must be provided when creating a new lobby.", 
            {status: 400}
        );

    if(board && board.length > 100)
        return new Response(
            "Invalid request. board length must be less than 100.", 
            {status: 400}
        );

    if(totalTime){
        const totalTimeNumber = parseFloat(totalTime);
        if(isNaN(totalTimeNumber) 
            || totalTimeNumber < MIN_TOTAL_TIME 
                || totalTimeNumber > MAX_TOTAL_TIME)
            return new Response(
                "Invalid request. totalTime must be a number between 0.1 and 60.", 
                {status: 400}
            );
    }

    if(incrementTime){
        const incrementTimeNumber = parseInt(incrementTime);
        if(isNaN(incrementTimeNumber) 
            || incrementTimeNumber < MIN_INCREMENT_TIME 
                || incrementTimeNumber > MAX_INCREMENT_TIME)
            return new Response(
                "Invalid request. incrementTime must be a number between 0 and 30.", 
                {status: 400}
            );
    }

    if(lobbyId && !LobbyManager.isLobbyExist(lobbyId))
        return new Response("Lobby not found.", {status: 404});

    return { name, lobbyId, userToken, board, totalTime, incrementTime };
}

/**
 * Handle the player name process. This contains creating a new lobby 
 * or joining an existing lobby.
 */
function handlePlayerNameProcess(
    lobbyId: string | null, 
    board: string | JsonNotation | StartPosition, 
    duration: [number, number]
): Response | { lobbyId: string, userToken: string }
{
    if(!lobbyId)
        lobbyId = LobbyManager.createLobby(board, duration);
    else{
        const lobby = LobbyManager.getLobby(lobbyId)!;
        if(lobby.isGameAlreadyStarted())
            return new Response("Lobby is already started to play.", {status: 400});
    }

    return { lobbyId, userToken: createUserToken() };
}

/**
 * Handle the user token process. This contains reconnecting 
 * to the lobby.
 */
function handleUserTokenProcess(
    lobbyId: string, 
    userToken: string | null
): Response | { lobbyId: string, name: string } 
{
    const lobby = LobbyManager.getLobby(lobbyId!)!;
    const name = lobby.getTokenName(userToken!);
    if(!name)
        return new Response("Invalid user token.", {status: 401});
    if(lobby.isTokenOnline(userToken!))
        return new Response("User is already online.", {status: 400});

    return { lobbyId, name };
}

/**
 * Handle the parameters. If the parameters provided 
 * as correct, it will return the lobbyId and userToken
 * or name(name of the player). If the parameters are
 * incorrect, it will return a response.
 */
function handleParameters(...params: any): 
    Response | { 
        lobbyId: string, 
        name: string, 
        userToken: string, 
        board: string, 
        totalTime: string, 
        incrementTime: string 
    }
{   
    let handledParams: Response | { lobbyId: string, name: string} | { lobbyId: string, userToken: string };
    if(params && params.playerName)
        handledParams = handlePlayerNameProcess(
            params.lobbyId, 
            params.board as string, 
            [parseInt(params.totalTime!), parseInt(params.incrementTime!)]
        );
    else
        handledParams = handleUserTokenProcess(
            params.lobbyId!, 
            params.userToken
        );

    if(handledParams instanceof Response)
        return handledParams;

    return {...params, ...handledParams};
}

/**
 * Server instance.
 */
const server = Bun.serve<WebSocketData>({
    port: SERVER_PORT,
    fetch(req: Request, server: Server) {
        if(!isOriginAllowed(req))
            return new Response("Invalid origin.", {status: 403});
        
        // Check if the parameters are valid.
        const parameterValidation = areParametersValid(req);
        if(parameterValidation instanceof Response)
            return parameterValidation;
        
        // Handle the parameters and get lobbyId and userToken or name.
        const finalParameters = handleParameters(parameterValidation);
        if(finalParameters instanceof Response)
            return finalParameters;

        const { 
            lobbyId, 
            userToken,
            name,
            board,
            totalTime,
            incrementTime
        } = finalParameters;

        // upgrade the connection.
        const success = server.upgrade(req, {
            data: {
                lobbyId: lobbyId, 
                player: { 
                    name: name, 
                    userToken: userToken,
                    isOnline: true,
                    color: null 
                },
                board: board,
                totalTime: totalTime,
                incrementTime: incrementTime
            } 
        });
        if(success) return;

        return undefined;
    },
    websocket: {
        open(ws: RWebSocket) {
            joinLobby(ws);
        },
        message(ws: RWebSocket, message: string) {
            // Last Move gönderilir {frm: "e2", to: "e4"} şeklinde olabilir.
            ws.send(`You said: ${message}`);
        },
        close(ws: RWebSocket) {
            leaveLobby(ws, true);
        },
        maxPayloadLength: MAX_PAYLOAD_LENGTH,
        idleTimeout: 960,
    }
});
  
console.log(`Listening on http://localhost:${server.port} ...`);

/**
 * Join the lobby and start the game if the lobby is ready.
 * Send connected command to the client.
 */
function joinLobby(ws: RWebSocket){
    const lobbyId = ws.data.lobbyId;
    const player = ws.data.player;
    const lobby = LobbyManager.joinLobby(lobbyId, player);
    if(lobby){
        ws.subscribe(lobbyId);
        ws.send(WsCommand.connected(player));
        console.log("Connection opened: ", lobbyId, player.color, player.name);

        console.log("Is game ready to start: ", lobby.isGameReadyToStart());
        if(lobby.isGameReadyToStart()){
            lobby.startGame();
            server.publish(lobbyId, WsCommand.started({
                whitePlayerName: lobby.getWhitePlayerName(),
                blackPlayerName: lobby.getBlackPlayerName(),
                board: lobby.getCurrentBoard(),
                duration: lobby.getDuration()
            }));
            console.log("Game started: ", lobbyId);
        }
    }
}

/**
 * Leave the lobby and send disconnected command to the client.
 */
function leaveLobby(ws: RWebSocket, isDisconnected: boolean = false){
    const lobbyId = ws.data.lobbyId;
    const player = ws.data.player;
    if(!LobbyManager.leaveLobby(lobbyId, player, isDisconnected)) return;
    
    ws.send(WsCommand.disconnected(player));
    ws.unsubscribe(lobbyId);

    console.log("Connection closed: ", lobbyId, player.color, player.name);
}
