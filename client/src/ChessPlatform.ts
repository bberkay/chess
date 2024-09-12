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
import { Color, StartPosition } from '@Chess/Types';
import { DEFULT_PLAYER_NAME, DEFAULT_TOTAL_TIME, DEFAULT_INCREMENT_TIME } from "@Platform/Consts";

/**
 * This class is the main class of the chess platform.
 * It provides the connections between the chess, menu and other systems.
 */
export class ChessPlatform{

    public readonly chess: Chess;
    public readonly platform: Platform;
    public readonly logger: Logger = new Logger("src/ChessPlatform.ts");

    private socket: WebSocket | null = null;

    private _bindedSocketOperationItems: HTMLElement[] = [];
    private _isSocketOperationsBindedOnce: boolean = false;

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
        if(!LocalStorage.isExist(LocalStorageKey.WelcomeShown))
        {
            this.platform.navigatorModal.showWelcome();
            LocalStorage.save(LocalStorageKey.WelcomeShown, true);
        }  

        if(LocalStorage.isExist(LocalStorageKey.LastLobbyConnection))
            this.reconnectLobby();
        else if(this.checkAndGetLobbyIdFromUrl())
            this.platform.navigatorModal.showJoinLobby();

        this.bindSocketOperations();
        this.logger.save("Chess platform is initialized.");
    }

     /**
     * Find the socket operations and bind them to the menu 
     * items. When the user clicks on the menu item, the
     * operation will be executed.
     */
    private bindSocketOperations(): void
    {
        if(this._isSocketOperationsBindedOnce) return;
        this._isSocketOperationsBindedOnce = true;
        document.querySelectorAll("[data-socket-operation]").forEach((menuItem) => {
            menuItem.addEventListener("click", () => { this.handleSocketOperation(menuItem as HTMLElement) });
        });

        const observer = new MutationObserver((mutations) => {
            for(const mutation of mutations){
                if(mutation.addedNodes.length === 0 || (mutation.target as HTMLElement).id === "log-list") return;
                for(const node of mutation.addedNodes){
                    if(node instanceof HTMLElement){
                        const socketOperationItems = node.querySelectorAll("[data-socket-operation]") as NodeListOf<HTMLElement>;
                        for(const socketOperationItem of socketOperationItems){
                            if(socketOperationItem && !this._bindedSocketOperationItems.includes(socketOperationItem))
                            {
                                socketOperationItem.addEventListener("click", () => { 
                                    this.handleSocketOperation(socketOperationItem as HTMLElement) 
                                });
                                this._bindedSocketOperationItems.push(socketOperationItem);
                            }
                        }
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true, characterData: false, attributes: false });
        this.logger.save("Socket operations are bound to the menu items.");
    }

    /**
     * Handle the socket operation of the given socket operation item.
     */
    private handleSocketOperation(socketOperationItem: HTMLElement): void
    {
        const operation = socketOperationItem.getAttribute("data-socket-operation") as SocketOperation;
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
            const [ wsCommand, wsData ] = event.data.split(/ (.+)/);
            return [wsCommand, JSON.parse(wsData)];
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

        let player: {name: string, userToken: string, isOnline: boolean, color: Color};
        let disconnectedPlayer: {name: string, color: Color} | null = null;
        let lobbyId: string;
        this.socket.onmessage = (event) => {
            const [wsCommand, wsData] = parseWsResponse(event);
            console.log("after response: ", wsCommand, wsData); 
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
                    if(LocalStorage.isExist(LocalStorageKey.BoardEditorEnabled)) 
                        LocalStorage.clear(LocalStorageKey.BoardEditorEnabled);
                    
                    if(disconnectedPlayer){
                        // Started command is received again after the disconnected player is reconnected.
                        this.platform.notationMenu.displayPlayerAsOnline(player.color);
                        disconnectedPlayer = null;
                    }
                    else{
                        // Started command is received for the first time after both players are connected.
                        this.platform.prepareComponentsForOnlineGame(player.color, wsData);
                    }
                    break;
                case WsCommand.Disconnected:
                    disconnectedPlayer = wsData.player;
                    this.platform.notationMenu.displayPlayerAsOffline(disconnectedPlayer!.color);
                    break;
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
