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
import type { 
    CreateLobbyReqParams, 
    JoinLobbyReqParams, 
    ReconnectLobbyReqParams, 
    RWebSocket, 
    WebSocketData, 
    WebSocketReqParams, 
    BaseWebSocketReqParams, 
    Player
} from "./Types";
import type { Durations, JsonNotation, Square, StartPosition } from "@Chess/Types";
import { Color } from "@Chess/Types";
import { MoveValidationError } from "@Chess/Engine/ChessEngine";
import { LobbyManager } from "./Classes/LobbyManager";
import { 
    createRandomId,
    isValidLength,
    isInRange, 
    updateKeys
} from "./Classes/Helper";
import { MAX_PAYLOAD_LENGTH, SERVER_PORT } from "./Consts";
import { ALLOWED_ORIGINS } from "./Consts";
import { 
    ID_LENGTH,
    MAX_PLAYER_NAME_LENGTH,
    MIN_PLAYER_NAME_LENGTH,
    MAX_TOTAL_TIME,
    MIN_TOTAL_TIME,
    MAX_INCREMENT_TIME,
    MIN_INCREMENT_TIME
} from "./Consts";
import { SocketManager } from "./Classes/SocketManager";
import { 
    WsCommand, 
    WsTitle,
    WsMovedData,
    type WsStartedData
} from "./Classes/WsCommand";
import { Lobby } from "./Classes/Lobby";

/**
 * Check if the origin is allowed to connect.
 */
function isOriginAllowed(req: Request): boolean {
    const origin = req.headers.get("origin") || "";
    if(!origin) return false;
    return ALLOWED_ORIGINS.includes(origin);
}

/**
 * 
 */
function validate(params: BaseWebSocketReqParams): Response | boolean 
{
    const validations: Record<string, boolean> = {
        name: params.name === "" || isInRange(params.name.length, MIN_PLAYER_NAME_LENGTH, MAX_PLAYER_NAME_LENGTH),
        lobbyId: params.lobbyId === "" || isValidLength(params.lobbyId, ID_LENGTH) && LobbyManager.isLobbyExist(params.lobbyId),
        userToken: params.userToken === "" || isValidLength(params.userToken, ID_LENGTH),
        board: params.board === "" || params.board.length <= 100,
        remaining: params.remaining === "" || isInRange(parseInt(params.remaining as string), MIN_TOTAL_TIME, MAX_TOTAL_TIME),
        increment: params.increment === "" || isInRange(parseInt(params.increment as string), MIN_INCREMENT_TIME, MAX_INCREMENT_TIME)
    };
    console.log("Validations: ", validations);

    const errors: Record<string, string> = {
        name: `Invalid request. playerName length must be between ${MIN_PLAYER_NAME_LENGTH} and ${MAX_PLAYER_NAME_LENGTH}.`,
        lobbyId: `Invalid request. lobbyId length must be ${ID_LENGTH} length and lobby must be exist.`,
        userToken: `Invalid request. userToken length must be ${ID_LENGTH}.`,
        board: "Invalid request. board length must be less than 100.",
        remaining: `Invalid request. remaining must be a number between ${MIN_TOTAL_TIME} and ${MAX_TOTAL_TIME}.`,
        increment: `Invalid request. increment must be a number between ${MIN_INCREMENT_TIME} and ${MAX_INCREMENT_TIME}.`
    };
    
    for(const key in validations){
        if(!validations[key])
            return new Response(errors[key], {status: 400});
    }

    return true;
}

/**
 * 
 */
function validateCombination(params: BaseWebSocketReqParams): Response | boolean
{
    if (params.name && params.userToken)
        return new Response("Invalid request. name and userToken cannot be used together.", { status: 400 });

    if (!params.name && !params.userToken)
        return new Response("Invalid request. name or userToken must be provided.", { status: 400 });

    if (params.userToken && !params.lobbyId)
        return new Response("Invalid request. userToken must be used with lobbyId.", { status: 400 });

    if ((params.board || params.remaining || params.increment) && (!params.name || params.lobbyId || params.userToken))
        return new Response("Invalid request. board, remaining, increment can only be used when creating a new lobby.", { status: 400 });

    if (params.name && !params.lobbyId && (!params.board || !params.remaining || !params.increment))
        return new Response("Invalid request. board, remaining, increment must be provided when creating a new lobby.", { status: 400 });

    return true;
}

/**
 * 
 */
function findWebSocketReqParams(params: BaseWebSocketReqParams): Response | WebSocketReqParams
{
    if(params.name && params.board && params.remaining && params.increment)
        return { name: params.name, board: params.board, remaining: params.remaining, increment: params.increment } as CreateLobbyReqParams;

    if(params.name && params.lobbyId)
        return { name: params.name, lobbyId: params.lobbyId } as JoinLobbyReqParams;

    if(params.userToken && params.lobbyId)
        return { userToken: params.userToken, lobbyId: params.lobbyId } as ReconnectLobbyReqParams;

    return new Response("Invalid request.", { status: 400 });
}

/**
 * Check if the parameters are valid.
 */
function areParametersValid(req: Request): Response | WebSocketReqParams
{
    const url = new URL(req.url);
    const params: BaseWebSocketReqParams = {
        name: url.searchParams.get("name") || "",
        lobbyId: url.searchParams.get("lobbyId") || "",
        userToken: url.searchParams.get("userToken") || "",
        board: url.searchParams.get("board") || "",
        remaining: url.searchParams.get("remaining") || "",
        increment: url.searchParams.get("increment") || ""
    }
    console.log("Params: ", params);
    let validation = validate(params);
    if(validation instanceof Response)
        return validation;

    validation = validateCombination(params);
    if(validation instanceof Response)
        return validation;

    const webSocketReqParams = findWebSocketReqParams(params);
    if(webSocketReqParams instanceof Response)
        return webSocketReqParams;
    
    return webSocketReqParams;
}

/**
 * 
 */
function createLobbyAndGetLobbyJoiningData(createLobbyReqParams: CreateLobbyReqParams): Response | { lobbyId: string, userToken: string }
{
    const lobbyId = LobbyManager.createLobby(
        createLobbyReqParams.board, 
        {
            remaining: typeof createLobbyReqParams.remaining === "string" 
                ? parseInt(createLobbyReqParams.remaining) 
                : createLobbyReqParams.remaining,
            increment: typeof createLobbyReqParams.increment === "string" 
                ? parseInt(createLobbyReqParams.increment) 
                : createLobbyReqParams.increment
        }
    );

    return { lobbyId, userToken: createRandomId(ID_LENGTH) };
}

/**
 * 
 */
function getLobbyJoiningData(joinLobbyReqParams: JoinLobbyReqParams): Response | { lobbyId: string, userToken: string }
{
    const lobby = LobbyManager.getLobby(joinLobbyReqParams.lobbyId);
    if(!lobby)
        return new Response("Lobby not found.", {status: 404});

    if(lobby.isGameStarted())
        return new Response("Lobby is already started to play or finished.", {status: 400});

    return { lobbyId: joinLobbyReqParams.lobbyId, userToken: createRandomId(ID_LENGTH) };
}

/**
 * 
 */
function getReconnectingLobbyData(reconnectLobbyReqParams: ReconnectLobbyReqParams): Response | { lobbyId: string, name: string }
{
    const lobby = LobbyManager.getLobby(reconnectLobbyReqParams.lobbyId);
    if(!lobby)
        return new Response("Lobby not found.", {status: 404});

    const name = lobby.getTokenName(reconnectLobbyReqParams.userToken);
    if(!name)
        return new Response("Invalid user token.", {status: 401});
    if(lobby.isTokenOnline(reconnectLobbyReqParams.userToken))
        return new Response("User is already online.", {status: 400});

    return { lobbyId: reconnectLobbyReqParams.lobbyId, name };
}

/**
 * 
 */
function handleParameters(req: Request): Response | { lobbyId: string, userToken: string, name: string }
{
    // Check if the parameters are valid.
    let params = areParametersValid(req);
    if(params instanceof Response)
        return params;

    let neededParams = updateKeys({lobbyId: "", userToken: "", name: ""}, params);
    if((params as CreateLobbyReqParams).board !== undefined)
        neededParams = updateKeys(neededParams, createLobbyAndGetLobbyJoiningData(params as CreateLobbyReqParams));
    else if((params as ReconnectLobbyReqParams).userToken !== undefined)
        neededParams = updateKeys(neededParams, getReconnectingLobbyData(params as ReconnectLobbyReqParams));
    else if((params as JoinLobbyReqParams).lobbyId !== undefined)
        neededParams = updateKeys(neededParams, getLobbyJoiningData(params as JoinLobbyReqParams));

    return neededParams as { lobbyId: string, userToken: string, name: string };
}

function isHttpRequest(req: Request): boolean
{
    return req.headers.get("upgrade") === null;
}

function handleHttpRequest(req: Request): Response
{
    if(req.method !== "GET")
        return new Response("Only GET method is allowed.", {status: 405});

    if(req.url === "/")
        return new Response("Chess server is running.", {status: 200});

    const url = new URL(req.url);

    // Parameters:
    if(url.searchParams.has("lobbyId")){
        const lobbyId = url.searchParams.get("lobbyId") as string;
        if(LobbyManager.isLobbyExist(lobbyId))
            return new Response("Lobby is exist.", {status: 200});
        return new Response("Lobby not found.", {status: 404});
    }

    return new Response("Invalid request.", {status: 400});
}

function isWebSocketRequest(req: Request): boolean
{
    return req.headers.get("upgrade") === "websocket";
}

/**
 * Server instance.
 */
const server = Bun.serve<WebSocketData>({
    port: SERVER_PORT,
    fetch(req: Request, server: Server) {
        if(!isOriginAllowed(req))
            return new Response("Invalid origin.", {status: 403});
        
        if(isHttpRequest(req))
            return handleHttpRequest(req);

        if(!isWebSocketRequest(req))
            return new Response("Only websocket or http GET requests are allowed.", {status: 400});

        // Handle the parameters and get 
        // lobbyId and (userToken or name).
        const params = handleParameters(req);
        if(params instanceof Response)
            return params;

        const { 
            lobbyId, 
            userToken,
            name
        } = params;

        // upgrade the connection.
        const success = server.upgrade(req, {
            data: {
                lobbyId: lobbyId, 
                player: { 
                    name: name, 
                    userToken: userToken,
                    isOnline: true,
                    color: null 
                }
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
            console.log("Ws:", ws.data.player.name, ws.data.player.color, "Message: ", message);
            if(SocketManager.getSocket(ws.data.lobbyId, ws.data.player.userToken) === ws)
                handleMessage(ws, message);
        },
        close(ws: RWebSocket) {
            if(SocketManager.getSocket(ws.data.lobbyId, ws.data.player.userToken) === ws)
                leaveLobby(ws);
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
function joinLobby(ws: RWebSocket): void
{
    const lobbyId = ws.data.lobbyId;
    const player = ws.data.player;
    const lobby = LobbyManager.joinLobby(lobbyId, player);
    if(lobby){
        ws.subscribe(lobbyId);
        ws.send(WsCommand.connected({lobbyId, player}));
        SocketManager.addSocket(ws.data.lobbyId, ws.data.player.userToken, ws);
        console.log("Lobby Join: ", lobbyId, player.color, player.name);
        startGame(lobby);
    }
}

/**
 * Leave the lobby and send disconnected command to the client.
 */
function leaveLobby(ws: RWebSocket): void
{
    const lobbyId = ws.data.lobbyId;
    const player = ws.data.player;
    if(!LobbyManager.leaveLobby(lobbyId, player)) return;
        
    server.publish(lobbyId, WsCommand.disconnected({
        lobbyId: lobbyId,
        disconnectedPlayer: {name: player.name, color: player.color}
    }));
    ws.unsubscribe(lobbyId);
    SocketManager.removeSocket(lobbyId, player.userToken);
    console.log("Connection closed: ", lobbyId, player.color, player.name);
    LobbyManager.deleteLobbyIfDead(lobbyId);
}

/**
 * Start the game of the given lobby id if 
 * it is ready.
 */
function startGame(lobby: Lobby): void
{
    const isGameReadyToStart = lobby.isGameReadyToStart();
    const isGameAlreadyStarted = lobby.isGameStarted();
    if(isGameReadyToStart || isGameAlreadyStarted){
        const whitePlayer = lobby.getWhitePlayer()!;
        const blackPlayer = lobby.getBlackPlayer()!;

        if(isGameReadyToStart)
        {
            // Both players are online and the game isn't started yet.
            // so start the game.
            lobby.startGame();
            server.publish(lobby.id, WsCommand.started(({
                whitePlayer: {
                    name: whitePlayer.name, 
                    isOnline: whitePlayer.isOnline
                },
                blackPlayer: {
                    name: blackPlayer.name, 
                    isOnline: blackPlayer.isOnline
                },
                game: lobby.getCurrentGame()
            }) as WsStartedData));
            monitorGameTimeExpiration(lobby);
        }
        else if(isGameAlreadyStarted)
        {
            // One of the players is should be reconnected to the game.
            // send current board and durations to the reconnected player.
            const reconnectedPlayer = lobby.getLastConnectedPlayer();
            if(!reconnectedPlayer) return;

            const reconnectedPlayerWs = SocketManager.getSocket(
                lobby.id, 
                reconnectedPlayer.userToken
            )!;
            if(!reconnectedPlayerWs) return;

            reconnectedPlayerWs.send(WsCommand.started(({
                whitePlayer: {
                    name: whitePlayer.name, 
                    isOnline: whitePlayer.isOnline
                },
                blackPlayer: {
                    name: blackPlayer.name, 
                    isOnline: blackPlayer.isOnline
                },
                game: lobby.getCurrentGame()
            }) as WsStartedData));

            const opponentPlayer = reconnectedPlayer.color === Color.White
                ? lobby.getBlackPlayer()
                : lobby.getWhitePlayer();
            if(!opponentPlayer) return;

            const opponentPlayerWs = SocketManager.getSocket(
                lobby.id, 
                opponentPlayer.userToken
            )!;
            if(!opponentPlayerWs) return;

            opponentPlayerWs.send(WsCommand.reconnected({
                lobbyId: lobby.id,
                reconnectedPlayer: {
                    name: reconnectedPlayer.name, 
                    color: reconnectedPlayer.color
                }
            }));
        }
    }
}

/**
 * Monitor and check if the game is finished because 
 * one of the players' time has expired.
 */
function monitorGameTimeExpiration(lobby: Lobby): void
{
    const interval = setInterval(() => {
        if(lobby.isGameFinished()){
            finishGame(lobby);
        }
    }, 1000);

    lobby.setGameTimeMonitorInterval(interval as unknown as number);
}

/**
 * Handle the messages from the client.
 */
function handleMessage(ws: RWebSocket, message: string): void
{
    const [command, data] = WsCommand.parse(message);
    if(!command || !data) return;

    const lobby = LobbyManager.getLobby(ws.data.lobbyId);
    const player = ws.data.player;
    if(!lobby || !lobby.canPlayerParticipate(player, (command !== WsTitle.PlayAgainOffered)))
        return;

    console.log("Command: ", command, "Data: ", data);
    try{
        switch(command){
            case WsTitle.Moved:
                movePiece(lobby, player, (data as WsMovedData).from, (data as WsMovedData).to);
                break;
            case WsTitle.Resigned:
                resign(lobby, player);
                break;
            case WsTitle.DrawOffered:
                offerDraw(lobby, player);
                break;
            case WsTitle.DrawAccepted:
                draw(lobby);
                break;
            case WsTitle.PlayAgainOffered:
                offerPlayAgain(lobby, player);
                break;
            case WsTitle.PlayAgainAccepted:
                playAgain(lobby);
                break;        
            case WsTitle.OfferCancelled:
                cancelOffer(lobby, player);
                break;
            case WsTitle.SentOfferDeclined:
                declineSentOffer(lobby, player);
                break;
        }
    }
    catch(e: any){
        ws.send(WsCommand.error({message: e.message}));
        return;
    }
}

/**
 * Move the piece on the board as the player wants
 * then send to the other player.
 */
function movePiece(lobby: Lobby, player: Player, from: Square, to: Square): void
{
    if(lobby.canPlayerMakeMove(player)){
        lobby.makeMove(from, to);
            
        const opponentPlayer = player.color === Color.White 
            ? lobby.getBlackPlayer() 
            : lobby.getWhitePlayer();
        if(!opponentPlayer) return;

        const opponentPlayerWs = SocketManager.getSocket(
            lobby.id, 
            opponentPlayer.userToken
        )!;
        if(!opponentPlayerWs) return;

        opponentPlayerWs.send(WsCommand.moved({from, to}));
        if(lobby.isGameFinished())
            finishGame(lobby);
    }
}

/**
 * Offer play again to the opponent player.
 */
function offerPlayAgain(lobby: Lobby, player: Player): void
{
    _offer(lobby, player, WsCommand.playAgainOffered);
}

/**
 * Offer draw to the opponent player.
 */
function offerDraw(lobby: Lobby, player: Player): void
{
    _offer(lobby, player, WsCommand.drawOffered);
}

/**
 * Cancel the offer and send the offer cancelled command to the client.
 */
function cancelOffer(lobby: Lobby, player: Player): void
{
    _offer(lobby, player, WsCommand.sentOfferCancelled);
    lobby.resetOfferCooldowns();
}

/**
 * Decline the sent offer and send the declined command to the client.
 */
function declineSentOffer(lobby: Lobby, player: Player): void
{
    _offer(lobby, player, WsCommand.sentOfferDeclined);
    lobby.resetOfferCooldowns();
}

/**
 * Offer to the opponent player.
 * @param {WsCommand.function} offer WsCommand function to send the offer
 * like WsCommand.playAgainOffered or WsCommand.drawOffered.
 */
function _offer(lobby: Lobby, player: Player, offer: () => string): void
{
    const opponentPlayer = player.color === Color.White 
        ? lobby.getBlackPlayer() 
        : lobby.getWhitePlayer();
    if(!opponentPlayer) return;

    const opponentPlayerWs = SocketManager.getSocket(
        lobby.id, 
        opponentPlayer.userToken
    )!;
    if(!opponentPlayerWs) return;

    opponentPlayerWs.send(offer());
    lobby.setOfferCooldown(player);
}

/**
 * Accept the play again offer and send the started command to the client.
 */
function playAgain(lobby: Lobby): void
{
    startGame(lobby);
}

/**
 * Resign the game and send the finished command to the client.
 */
function resign(lobby: Lobby, player: Player): void
{
    lobby.clearGameTimeMonitorInterval();
    lobby.resign(player);
    _finishGame(lobby, false, true, player.color);
}

/**
 * Accept the draw offer and send the finished command to the client.
 */
function draw(lobby: Lobby): void
{
    lobby.clearGameTimeMonitorInterval();
    lobby.draw();
    _finishGame(lobby, true);
}

/**
 * Finish the game and send the finished command 
 * to the client.
 */
function finishGame(lobby: Lobby): void
{
    lobby.clearGameTimeMonitorInterval();
    _finishGame(lobby);
}

/**
 * Send finished command to the client.
 */
function _finishGame(
    lobby: Lobby,
    isDraw: boolean = false, 
    isResigned: boolean = false, 
    resignColor: Color | null = null
): void
{
    if(lobby.isGameFinished()) return;
    
    if(isDraw && (isResigned || resignColor))
        throw new Error("isDraw and isResigned or resignColor cannot be used together.");

    if((isResigned && !resignColor) || (!isResigned && resignColor))
        throw new Error("isResigned and resignColor must be used together.");

    if(isResigned){
        server.publish(lobby.id, WsCommand.finished({
            gameStatus: lobby.getGameStatus(),
            isResigned: true,
            resignColor: resignColor as Color
        }));
    }
    else if (isDraw){
        server.publish(lobby.id, WsCommand.finished({
            gameStatus: lobby.getGameStatus(),
            isDrawOffered: true
        }));
    } 
    else {
        server.publish(lobby.id, WsCommand.finished({
            gameStatus: lobby.getGameStatus()
        }));
    }

    lobby.resetOfferCooldowns();
}
