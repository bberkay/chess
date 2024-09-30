/**
 * @module ChessPlatform
 * @description This class is the main class of the chess platform. It provides the connections between the chess, menu and other systems.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import { Chess } from '@Chess/Chess';
import { Platform } from "@Platform/Platform.ts";
import { Logger } from "@Services/Logger";
import { LocalStorage, LocalStorageKey } from "@Services/LocalStorage.ts";
import { ChessEvent, StartPosition } from '@Chess/Types';
import { DEFULT_PLAYER_NAME, DEFAULT_TOTAL_TIME, DEFAULT_INCREMENT_TIME } from "@Platform/Consts";
import { PlatformEvent } from '@Platform/Types';
import type {
    CreateLobbyReqParams,
    Player,
    WsData,
    WsConnectedData,
    WsDisconnectedData,
    WsErrorData,
    WsMessage,
    WsMovedData,
    WsReconnectedData,
    WsStartedData,
    JoinLobbyReqParams,
    ReconnectLobbyReqParams,
    WsFinishedData
} from "./Types";
import { SocketOperation, WsTitle } from "./Types";
import { RECONNECTION_ATTEMPT_LIMIT, RECONNECTION_TIMEOUT } from "./Consts";

/**
 * This class is the main class of the chess platform.
 * It provides the connections between the chess, menu and other systems.
 */
export class ChessPlatform{

    public readonly chess: Chess;
    public readonly platform: Platform;
    public readonly logger: Logger = new Logger("src/ChessPlatform.ts");

    private socket: WebSocket | null = null;
    private reconnectionAttemptRemaining: number = RECONNECTION_ATTEMPT_LIMIT;

    /**
     * Constructor of the ChessPlatform class.
     */
    constructor() {
        this.chess = new Chess();
        this.platform = new Platform(this.chess);
        this.init();
    }

    /**
     * Initialize the chess platform.
     */
    private init(): void
    {
        /**
         * Find the socket operations and bind them to the menu 
         * items. When the user clicks on the menu item, the
         * operation will be executed.
         */
        const bindSocketOperations = () => {
            document.querySelectorAll("[data-socket-operation]").forEach((menuItem) => {
                menuItem.addEventListener("click", () => {
                    this.handleSocketOperation(menuItem as HTMLElement) 
                });
            });

            document.addEventListener(PlatformEvent.OnOperationMounted, ((event: CustomEvent) => {
                if(typeof event.detail.selector === "string"){
                    const socketOperations = document.querySelectorAll(`${event.detail.selector} [data-socket-operation]`);
                    if(!socketOperations) return;
                    socketOperations.forEach((menuItem) => {
                        menuItem.addEventListener("click", () => {
                            this.handleSocketOperation(menuItem as HTMLElement) 
                        });
                    });
                }
                else if(event.detail.selector instanceof HTMLElement){
                    if(!event.detail.selector.hasAttribute("data-socket-operation")) return;
                    event.detail.selector.addEventListener("click", () => {
                        this.handleSocketOperation(event.detail.selector as HTMLElement) 
                    });
                }
            }) as EventListener);

            this.logger.save("Socket operations are bound to the menu items.");
        }

        /**
         * Connect to the last connection if exists.
         */
        const connectToLastConnectionOrLobbyUrl = () => {
            if(this.checkAndGetLobbyIdFromUrl())
                this.platform.navigatorModal.showJoinLobby();
            else if(LocalStorage.isExist(LocalStorageKey.LastLobbyConnection))
                this.reconnectLobby();
        }

        /**
         * Initialize the chess platform.
         */
        connectToLastConnectionOrLobbyUrl();
        bindSocketOperations();
        this.logger.save("Chess platform is initialized.");
    }

    /**
     * Handle the socket operation of the given socket operation item.
     */
    private handleSocketOperation(socketOperationItem: HTMLElement): void
    {
        const operation = socketOperationItem.getAttribute("data-socket-operation") as SocketOperation;
        if(operation != SocketOperation.CancelLobby && LocalStorage.isExist(LocalStorageKey.BoardEditorEnabled)) 
            LocalStorage.clear(LocalStorageKey.BoardEditorEnabled);
        
        switch(operation){
            case SocketOperation.CreateLobby:
                this.createLobby();
                break;
            case SocketOperation.JoinLobby:
                this.joinLobby();
                break;
            case SocketOperation.CancelLobby:
                this.cancelLobby();
                break;
        }
    }

    /**
     * Check the lobby id from the url and return it if exists.
     */
    private checkAndGetLobbyIdFromUrl(): string | null
    {
        const lobbyId = window.location.pathname.split("/").pop(); 
        return lobbyId || null;
    }

    /**
     * Display the lobby id on the url.
     */
    private displayLobbyIdOnUrl(lobbyId: string): void
    {
        const url = new URL(window.location.href);
        url.pathname = lobbyId;
        window.history.pushState({}, "", url.toString());
    }

    private _createLobby(createLobbyReqParams: CreateLobbyReqParams): void
    {
        this.createAndHandleWebSocket(new URLSearchParams(Object.entries(createLobbyReqParams)).toString());
    }

    /**
     * Create a new lobby with the given player name
     */
    private createLobby(): void
    {  
        const { playerName, board, duration } = this.platform.navigatorModal.getCreatedLobbySettings();
        console.log("create lobby:", playerName, board, duration);
        this._createLobby({
            name: playerName || DEFULT_PLAYER_NAME, 
            board: board || StartPosition.Standard,
            remaining: (duration.remaining || DEFAULT_TOTAL_TIME).toString(),
            increment: (duration.increment || DEFAULT_INCREMENT_TIME).toString()
        } as CreateLobbyReqParams);
    }

    private _joinLobby(joinLobbyReqParams: JoinLobbyReqParams): void
    {
        this.createAndHandleWebSocket(new URLSearchParams(Object.entries(joinLobbyReqParams)).toString());
    }

    /**
     * Connect to the lobby with the given lobby id.
     */
    private joinLobby(): void
    {
        const lobbyId = this.checkAndGetLobbyIdFromUrl();
        if(!lobbyId) return;

        const playerName = this.platform.navigatorModal.getEnteredPlayerName();
        this._joinLobby({
            name: playerName || DEFULT_PLAYER_NAME, 
            lobbyId: lobbyId
        } as JoinLobbyReqParams);
    }

    private _reconnectLobby(reconnectLobbyReqParams: ReconnectLobbyReqParams): void
    {
        this.createAndHandleWebSocket(new URLSearchParams(Object.entries(reconnectLobbyReqParams)).toString());
    }

    /**
     * Reconnect the last lobby that the user connected.
     */
    private reconnectLobby(): void
    {
        if(!LocalStorage.isExist(LocalStorageKey.LastLobbyConnection)) return;

        const lastLobbyConnection = LocalStorage.load(LocalStorageKey.LastLobbyConnection);
        this._reconnectLobby({
            lobbyId: lastLobbyConnection.lobbyId,
            userToken: lastLobbyConnection.player.userToken
        } as ReconnectLobbyReqParams);
    }

    /**
     * Cancel the game and close the socket connection
     */
    private cancelLobby(): void
    {
        LocalStorage.clear(LocalStorageKey.LastLobbyConnection);
        this.platform.navigatorModal.hide();
        this.socket?.close();
        this.platform.notationMenu.displayNewGameUtilityMenu();
        this.chess.board.lock();
    }

    /**
     * Handle the websocket socket connection and listen the
     * messages from the server.
     */
    private createAndHandleWebSocket(webSocketEndpoint: string): void
    {
        if(webSocketEndpoint.length > Number(import.meta.env.VITE_WS_ENDPOINT_MAX_LENGTH))
            throw new Error("The WebSocket URL is too long.");

        if(this.socket){
            this.socket.close();
            this.socket = null;
        }

        const webSocketUrl = import.meta.env.VITE_WS_ADDRESS + (webSocketEndpoint ? "?" + webSocketEndpoint : "");
        this.socket = new WebSocket(webSocketUrl);
        
        let lobbyId: string | null = null;
        let player: Player | null = null;
        let closeConnectionOnFinish = false;

        this.socket.onopen = (event) => {
            lobbyId = null;
            player = null;
            closeConnectionOnFinish = false;
        };

        this.socket.onmessage = (event) => {
            const [wsCommand, wsData] = WsCommand.parse(event.data);
            switch(wsCommand){
                case WsTitle.Connected:
                    lobbyId = (wsData as WsConnectedData).lobbyId;
                    player = (wsData as WsConnectedData).player;
                    if(!this.checkAndGetLobbyIdFromUrl()){
                        this.platform.navigatorModal.showLobbyInfo(window.location.origin + "/" + lobbyId);
                        this.displayLobbyIdOnUrl(lobbyId);
                    }
                    /*LocalStorage.save(
                        LocalStorageKey.LobbyConnections, 
                        (LocalStorage.load(LocalStorageKey.LobbyConnections) || []).concat(wsData)
                    );*/

                    LocalStorage.save(LocalStorageKey.LastLobbyConnection, wsData);
                    this.logger.save(`Connected to the lobby[${lobbyId}] as ${player.name}[${player.color}].`);
                    break;
                case WsTitle.Started:
                    this.platform.createOnlineGame(wsData as WsStartedData, player!.color);
                    document.addEventListener(ChessEvent.onPieceMovedByPlayer, ((event: CustomEvent) => {
                        if(!this.socket) return;
                        const { from, to } = event.detail;
                        this.socket?.send(WsCommand.moved({from, to}));
                        this.chess.board.lock(false);
                    }) as EventListener);
                    break;
                case WsTitle.Moved:
                    this.chess.board.unlock();
                    this.chess.playMove(
                        (wsData as WsMovedData).from, 
                        (wsData as WsMovedData).to
                    );
                    document.dispatchEvent(new CustomEvent(
                        ChessEvent.onPieceMovedByOpponent, {
                            detail: {
                                from: (wsData as WsMovedData).from, 
                                to: (wsData as WsMovedData).to
                            }
                        }
                    ));
                    break;
                case WsTitle.Finished:
                    if(this.chess.engine.getGameStatus() !== (wsData as WsFinishedData).gameStatus){
                        this.chess.board.lock();
                        this.platform.notationMenu.stopTimers();
                        this.platform.navigatorModal.showError("Unexpected game status. Game status is not equal to the server's game status.");
                        this.logger.save(`Game finished with the status: ${(wsData as WsFinishedData).gameStatus}.`);
                    }
                    closeConnectionOnFinish = true;
                    this.socket!.close();
                    break;
                case WsTitle.Disconnected:
                    this.platform.notationMenu.updatePlayerAsOffline(
                        (wsData as WsDisconnectedData).disconnectedPlayer.color
                    );
                    break;
                case WsTitle.Reconnected:
                    this.platform.notationMenu.updatePlayerAsOnline(
                        (wsData as WsReconnectedData).reconnectedPlayer.color
                    );
                    break;
                case WsTitle.Error:
                    this.platform.navigatorModal.showError((wsData as WsErrorData).message);
                    this.logger.save(`Error: ${(wsData as WsErrorData).message}`);
                    break;
                default:
                    throw new Error("Invalid WebSocket command.");
            }
        };

        this.socket.onerror = (event) => {
            this.platform.navigatorModal.showError(`An error occurred on the WebSocket connection. Retrying in <span id='reconnection-counter'></span> seconds...`, false);
            this.logger.save("An error occurred on the WebSocket connection. Retrying...");
            this.chess.board.lock();
            this.platform.notationMenu.stopTimers();

            // Retry the connection
            let remainingTime = RECONNECTION_TIMEOUT;
            const reconnectionTimeout = document.getElementById("reconnection-counter")!;
            const interval = window.setInterval(() => {
                if(remainingTime === 0 || !reconnectionTimeout){
                    reconnectionTimeout.innerText = "Reconnecting...";
                    clearInterval(interval);
                    remainingTime = RECONNECTION_TIMEOUT;
                    const timeout = window.setTimeout(() => {
                        this.platform.navigatorModal.hide();
                        if(this.reconnectionAttemptRemaining > 0){
                            this.reconnectionAttemptRemaining--;
                            this.createAndHandleWebSocket(webSocketEndpoint);
                        }
                        else{
                            this.platform.navigatorModal.showError("There is a problem with the WebSocket connection. Please try again later.");
                            this.logger.save("There is a problem with the WebSocket connection. Please try again later.");
                        }
                        clearTimeout(timeout);
                    }, RECONNECTION_TIMEOUT);
                }
                reconnectionTimeout.innerText = remainingTime.toString();
                remainingTime -= 1;
            }, 1000);
        };
        
        this.socket.onclose = (event) => {
            if(closeConnectionOnFinish){
                LocalStorage.clear(LocalStorageKey.LastBoard);
                LocalStorage.clear(LocalStorageKey.LastLobbyConnection);
                closeConnectionOnFinish = false;
            }
        };
    }
}

/**
 * This class is used to create WebSocket commands
 * to send to the client.
 */
class WsCommand{
    /**
     * Create a WebSocket command with the given command and data.
     * @example [Moved, {from: Square.a2, to: Square.a4}]
     */
    private static _wsCommand(title: WsTitle, data: WsData): string {
        if(Object.values(WsTitle).indexOf(title) === -1) 
            throw new Error("Invalid command.");

        return JSON.stringify([title, data]);
    }

    /**
     * Send moved command to the server.
     * @example [MOVED, {from: Square.a2, to: Square.a4}]
     */
    static moved(moveData: WsMovedData): string 
    {
        return this._wsCommand(WsTitle.Moved, moveData);
    }

    /**
     * Parse the websocket message from the server.
     * @param message "[Moved, {from: Square.a2, to: Square.a4}]"
     * @example [Moved, {from: Square.a2, to: Square.a4}]
     */
    static parse(message: string): WsMessage {
        return JSON.parse(message);
    }
}