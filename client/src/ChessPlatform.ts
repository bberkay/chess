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
    private socket: WebSocket | null = null;
    private socketOperationItems: HTMLElement[] = [];
    public readonly logger: Logger = new Logger("src/ChessPlatform.ts");

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
         (document.querySelectorAll("[data-socket-operation]") as NodeListOf<HTMLElement>).forEach((socketOperationItem: HTMLElement) => {
             if(this.socketOperationItems.length == 0 || !this.socketOperationItems.includes(socketOperationItem)){
                socketOperationItem.addEventListener("click", () => { this.handleSocketOperation(socketOperationItem) });
                 this.socketOperationItems.push(socketOperationItem);
             }
         });

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
            playerName: (playerName || DEFULT_PLAYER_NAME),
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
        if(!lobbyId) throw new Error("Lobby id is not found in the url.");

        this.createAndHandleWebSocket(new URLSearchParams({
            playerName: (playerName || DEFULT_PLAYER_NAME),
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
            userToken: lastLobbyConnection.userToken
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
        this.platform.notationMenu.setUtilityMenuToNewGame();
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

        this.socket = new WebSocket(import.meta.env.VITE_WS_ADDRESS + (webSocketEndpoint ? "?" + webSocketEndpoint : ""));
        this.socket.onopen = (event) => {

        };

        let playerWsData: any = {};
        this.socket.onmessage = (event) => {
            const [wsCommand, wsData] = parseWsResponse(event);
            console.log("after response: ", wsCommand, wsData); 
            switch(wsCommand){
                case WsCommand.Connected:
                    if(!this.checkAndGetLobbyIdFromUrl())
                        this.displayLobbyIdOnUrl(wsData.lobbyId);

                    playerWsData = wsData;
                    this.platform.navigatorModal.showLobbyInfo(window.location.origin + "/" + playerWsData.lobbyId);

                    /*LocalStorage.save(
                        LocalStorageKey.LobbyConnections, 
                        (LocalStorage.load(LocalStorageKey.LobbyConnections) || []).concat(wsData)
                    );*/
                    LocalStorage.save(LocalStorageKey.LastLobbyConnection, playerWsData);
                    this.logger.save(`Connected to the lobby[${playerWsData.lobbyId}] as ${playerWsData.playerName}[${playerWsData.color}].`);
                    break;
                case WsCommand.Started:
                    if(LocalStorage.isExist(LocalStorageKey.BoardEditorEnabled)) 
                        LocalStorage.clear(LocalStorageKey.BoardEditorEnabled);

                    this.platform.prepareComponentsForOnlineGame(wsData);
                    break;
            }
        };

        this.socket.onclose = (event) => {
            // if(onPurpose)
            //    LocalStorage.clear(LocalStorageKey.LastLobbyConnection);
        };
    }
}
