/**
 * @name Chess
 * @description Server side of the chess application.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess
 * @license MIT
 */

import { createServer } from "./BunServer";

/**
 * ********* Websocket Connection Rules ***********
 *
 * Creating Lobby:
 * ws://localhost:3000?name=Player1&board=pppppppprnbqkbnr/8/8/8/8/8/PPPPPPPPRNBQKBNR%20w%20KQkq%20-%200%201&totalTime=5&incrementTime=0
 * lobbyId and token will be created randomly by server
 * and sent to client with connected WsCommand. Example:
 * CONNECTED JSON.stringify({
 *  "lobbyId":"123456",
 *  "token":"123456",
 *  "color":"White",
 *  "name":"Player1"
 * })
 *
 * Connection to the lobby:
 * ws://localhost:3000?name=Player1&lobbyId=123456
 * token will be created randomly by server and sent to
 * client with connected WsCommand.
 *
 * Reconneting to the lobby:
 * ws://localhost:3000?token=123456&lobbyId=123456
 * name will be taken from the server by token
 * and sent to client with connected WsCommand.
 * Note: name will be taken from the server
 * by token for preventing the user to reconnect
 * lobby with different name.
 *
 * *************************************************
 */
createServer();
