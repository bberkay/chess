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
import { WsMessage, WsCommand, SocketOperation } from "./Types";
import { ChessEvent, Color, Square, StartPosition } from '@Chess/Types';
import { DEFULT_PLAYER_NAME, DEFAULT_TOTAL_TIME, DEFAULT_INCREMENT_TIME } from "@Platform/Consts";
import { PlatformEvent } from '@Platform/Types';

/**
 * This class is the main class of the chess platform.
 * It provides the connections between the chess, menu and other systems.
 */
export class ChessPlatform{

    public readonly chess: Chess;
    public readonly platform: Platform;
    public readonly logger: Logger = new Logger("src/ChessPlatform.ts");

    private socket: WebSocket | null = null;

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
        const connectToLastConnection = () => {
            if(LocalStorage.isExist(LocalStorageKey.LastLobbyConnection))
                this.reconnectLobby();
            else if(this.checkAndGetLobbyIdFromUrl())
                this.platform.navigatorModal.showJoinLobby();
        }

        /**
         * Initialize the chess platform.
         */
        connectToLastConnection();
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
                const { playerName, board, duration } = this.platform.navigatorModal.getCreatedLobbySettings();
                this.createLobby(playerName, board, duration);
                break;
            case SocketOperation.JoinLobby:
                this.joinLobby(this.platform.navigatorModal.getEnteredPlayerName());
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

    /**
     * Create a new lobby with the given player name
     */
    private createLobby(playerName: string, board: string, duration: [number, number]): void
    {  
        this.createAndHandleWebSocket(new URLSearchParams({
            name: (playerName || DEFULT_PLAYER_NAME),
            board: board || StartPosition.Standard,
            totalTime: (duration[0] || DEFAULT_TOTAL_TIME).toString(),
            incrementTime: (duration[1] || DEFAULT_INCREMENT_TIME).toString()
        }).toString());
    }

    /**
     * Connect to the lobby with the given lobby id.
     */
    private joinLobby(playerName: string): void
    {
        const lobbyId = this.checkAndGetLobbyIdFromUrl();
        if(!lobbyId) return;

        this.createAndHandleWebSocket(new URLSearchParams({
            name: (playerName || DEFULT_PLAYER_NAME),
            lobbyId: lobbyId
        }).toString());
    }

    /**
     * Reconnect the last lobby that the user connected.
     */
    private reconnectLobby(): void
    {
        if(!LocalStorage.isExist(LocalStorageKey.LastLobbyConnection)) return;

        const lastLobbyConnection = LocalStorage.load(LocalStorageKey.LastLobbyConnection);
        this.createAndHandleWebSocket(new URLSearchParams({
            lobbyId: lastLobbyConnection.lobbyId,
            userToken: lastLobbyConnection.player.userToken
        }).toString());
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
        /**
         * Parse the websocket response returned from the server.
         * @example [Connected, {lobbyId: "1234"}]
         * @example [Started, {lobbyId: "1234", board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"}]
         */
        function parseWsResponse(event: MessageEvent): [WsCommand, any] {
            console.log("Message: ", event.data);
            try{
                const [ wsCommand, wsData ] = event.data.split(/ (.+)/);
                return [wsCommand, JSON.parse(wsData)];
            }catch(error){
                throw new Error("Invalid WebSocket response.");
            }
        }    

        if(webSocketEndpoint.length > Number(import.meta.env.VITE_WS_ENDPOINT_MAX_LENGTH))
            throw new Error("The WebSocket URL is too long.");

        if(this.socket){
            this.socket.close();
            this.socket = null;
        }

        console.log("WebSocket endpoint: ", import.meta.env.VITE_WS_ADDRESS + (webSocketEndpoint ? "?" + webSocketEndpoint : ""));
        this.socket = new WebSocket(import.meta.env.VITE_WS_ADDRESS + (webSocketEndpoint ? "?" + webSocketEndpoint : ""));
        this.socket.onopen = (event) => {

        };

        let lobbyId: string;
        let player: {name: string, userToken: string, isOnline: boolean, color: Color};
        this.socket.onmessage = (event) => {
            const [wsCommand, wsData] = parseWsResponse(event);
            switch(wsCommand){
                case WsCommand.Connected:
                    lobbyId = wsData.lobbyId;
                    player = wsData.player;
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
                case WsCommand.Started:
                    this.platform.createOnlineGame(wsData, player.color);
                    document.addEventListener(ChessEvent.onPieceMovedByPlayer, ((event: CustomEvent) => {
                        if(!this.socket) return;
                        const { from, to } = event.detail;
                        this.socket?.send(JSON.stringify([WsCommand.Moved, {from, to}]));
                        this.chess.board.lock(false);
                    }) as EventListener);
                    break;
                case WsCommand.Moved:
                    this.chess.board.unlock();
                    this.chess.playMove(wsData.from, wsData.to);
                    document.dispatchEvent(new CustomEvent(
                        ChessEvent.onPieceMovedByOpponent, {detail: {from: wsData.from, to: wsData.to}}
                    ));
                    break;
                case WsCommand.Disconnected:
                    this.platform.notationMenu.updatePlayerAsOffline(wsData.player.color);
                    break;
                case WsCommand.Reconnected:
                    this.platform.notationMenu.updatePlayerAsOnline(wsData.player.color);
                    break;
                case WsCommand.Error:
                    this.platform.navigatorModal.showError(wsData.message);
                    this.logger.save(`Error: ${wsData}`);
                    break;
                default:
                    throw new Error("Invalid WebSocket command.");
            }
        };

        this.socket.onerror = (event) => {
        }
        
        this.socket.onclose = (event) => {
            // if(onPurpose)
            //    LocalStorage.clear(LocalStorageKey.LastLobbyConnection);
        };
    }

}
