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
import { ChessEvent, Color, GameStatus, StartPosition } from '@Chess/Types';
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
import { 
    RECONNECTION_ATTEMPT_LIMIT, 
    RECONNECTION_TIMEOUT,
    SERVER_ADDRESS,
    WS_ADDRESS,
    WS_ENDPOINT_MAX_LENGTH
} from "./Consts";
import { SocketOperation, WsTitle } from "./Types";

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

            document.addEventListener(PlatformEvent.onOperationMounted, ((event: CustomEvent) => {
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
        const connectToLastConnectionOrLobbyUrl = async () => {
            const lsLobbyId = LocalStorage.load(LocalStorageKey.LastLobbyConnection)?.lobbyId;
            const lobbyId = this.getLobbyIdFromUrl() || lsLobbyId;
            if(!lobbyId) return;

            const isLobbyIdValid = await this.checkLobbyId(lobbyId, !lsLobbyId);
            if(!isLobbyIdValid) return;
            
            if(!lsLobbyId)
                this.platform.navigatorModal.showJoinLobby();                
            else
                this.reconnectLobby();
        };        

        // If user creates single player game:
        document.addEventListener(PlatformEvent.onBoardCreated, (() => {
            this.forceClearLastConnection();
        }) as EventListener);

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
            case SocketOperation.Resign:
                this.resign();
                break;
            case SocketOperation.SendPlayAgainOffer:
                this.sendPlayAgainOffer();
                break;
            case SocketOperation.SendDrawOffer:
                this.sendDrawOffer();
                break;
            case SocketOperation.AcceptDrawOffer:
                this.acceptDrawOffer();
                break;
            case SocketOperation.AcceptPlayAgainOffer:
                this.acceptPlayAgainOffer();
                break
            case SocketOperation.DeclineSentOffer:
                this.declineSentOffer();
                break;
            case SocketOperation.CancelOffer:
                this.cancelOffer();
                break;
        }
    }

    /**
     * Check the lobby id from the URL and return it if it exists
     * and is valid.
     */
    private async checkLobbyId(lobbyId: string, showAsError: boolean = true): Promise<string | null>
    {
        try {
            const response = await fetch(SERVER_ADDRESS + "?lobbyId=" + lobbyId);
            if (!response.ok) {
                if(showAsError) this.platform.navigatorModal.showError("The lobby id is invalid.");
                this.forceClearLastConnection();
                return null;
            }
        } catch (error) {
            console.log("error", error);
            if(showAsError) this.platform.navigatorModal.showError("The lobby id cannot be checked.");
            this.forceClearLastConnection();
            return null;
        }

        return lobbyId;
    }

    /**
     * Get the lobby id from the URL if exists.
     */
    private getLobbyIdFromUrl(): string | null
    {
        return window.location.pathname.split("/").pop() || null;
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
     * Remove the lobby id from the url.
     */
    private removeLobbyIdFromUrl(): void
    {
        const url = new URL(window.location.href);
        url.pathname = "/";
        window.history.pushState({}, "", url.toString());
    }

    /**
     * Establishes a WebSocket connection for creating a new lobby.
     * It sends the necessary parameters like player name, board settings, and time control.
     */
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
        this._createLobby({
            name: playerName || DEFULT_PLAYER_NAME, 
            board: board || StartPosition.Standard,
            remaining: (duration.remaining || DEFAULT_TOTAL_TIME).toString(),
            increment: (duration.increment || DEFAULT_INCREMENT_TIME).toString()
        } as CreateLobbyReqParams);
    }

    /**
     * Establishes a WebSocket connection for joining an existing lobby.
     * It sends the necessary parameters like player name and lobby ID.
     */
    private _joinLobby(joinLobbyReqParams: JoinLobbyReqParams): void
    {
        this.createAndHandleWebSocket(new URLSearchParams(Object.entries(joinLobbyReqParams)).toString());
    }

    /**
     * Connect to the lobby with the given lobby id.
     */
    private joinLobby(): void
    {
        const lobbyId = this.getLobbyIdFromUrl();
        if(!lobbyId) return;

        const playerName = this.platform.navigatorModal.getEnteredPlayerName();
        this._joinLobby({
            name: playerName || DEFULT_PLAYER_NAME, 
            lobbyId: lobbyId
        } as JoinLobbyReqParams);
    }

    /**
     * Establishes a WebSocket connection to reconnect to a previously joined lobby.
     * It uses the saved lobby ID and user token to restore the connection.
     */
    private _reconnectLobby(reconnectLobbyReqParams: ReconnectLobbyReqParams): void
    {
        this.createAndHandleWebSocket(new URLSearchParams(Object.entries(reconnectLobbyReqParams)).toString());
    }

    /**
     * Reconnect the last lobby that the user connected.
     */
    private reconnectLobby(): void
    {
        if(!LocalStorage.isExist(LocalStorageKey.LastLobbyConnection)) 
            return;

        const lastLobbyConnection = LocalStorage.load(LocalStorageKey.LastLobbyConnection);
        this._reconnectLobby({
            lobbyId: lastLobbyConnection.lobbyId,
            token: lastLobbyConnection.player.token
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
     * Resign the game and send the resign command to the server.
     */
    private resign(): void
    {
        this.socket?.send(WsCommand.resigned());
    }

    /**
     * Send the play again offer to the opponent.
     */
    private sendPlayAgainOffer(): void
    {
        this.platform.navigatorModal.hide();
        this.platform.notationMenu.showPlayAgainOfferSent();
        this.socket?.send(WsCommand.playAgainOffered());
    }

    /**
     * Send the draw offer to the opponent.
     */
    private sendDrawOffer(): void
    {
        this.platform.notationMenu.showDrawOfferSent();
        this.socket?.send(WsCommand.drawOffered());
    }

    /**
     * Accept the draw offer from the opponent.
     */
    private acceptDrawOffer(): void
    {
        this.socket?.send(WsCommand.drawAccepted());
    }

    /**
     * Accept the play again offer from the opponent.
     */
    private acceptPlayAgainOffer(): void
    {
        this.socket?.send(WsCommand.playAgainAccepted());
    }

    /**
     * Cancel the offer that sent to the opponent.
     */
    private cancelOffer(): void
    {
        this.socket?.send(WsCommand.offerCanceled());
        this.platform.notationMenu.goBack();
    }

    /**
     * Decline the sent offer from the opponent.
     */
    private declineSentOffer(): void
    {
        this.socket?.send(WsCommand.sentOfferDeclined());
        this.platform.notationMenu.goBack();
    }

    /**
     * Clear the last connection completely and display the 
     * new game utility menu.
     */
    private forceClearLastConnection(): void
    {
        this.socket?.close();
        this.socket = null;
        LocalStorage.clear(LocalStorageKey.LastBoard);
        LocalStorage.clear(LocalStorageKey.LastLobbyConnection);
        this.removeLobbyIdFromUrl();        
        this.platform.notationMenu.displayNewGameUtilityMenu();
    }

    /**
     * Handle the websocket socket connection and listen the
     * messages from the server.
     */
    private createAndHandleWebSocket(webSocketEndpoint: string): void
    {
        if(webSocketEndpoint.length > Number(WS_ENDPOINT_MAX_LENGTH))
            throw new Error("The WebSocket URL is too long.");

        if(this.socket){
            this.socket.close();
            this.socket = null;
        }

        const webSocketUrl = WS_ADDRESS + (webSocketEndpoint ? "?" + webSocketEndpoint : "");
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
            console.log("message:", event.data);
            const [wsCommand, wsData] = WsCommand.parse(event.data);
            switch(wsCommand){
                case WsTitle.Connected:
                    lobbyId = (wsData as WsConnectedData).lobbyId;
                    player = (wsData as WsConnectedData).player;
                    this.platform.navigatorModal.showLobbyInfo(window.location.origin + "/" + lobbyId);
                    this.displayLobbyIdOnUrl(lobbyId);
                    LocalStorage.save(LocalStorageKey.LastLobbyConnection, wsData);
                    LocalStorage.save(LocalStorageKey.LastPlayerName, player.name);
                    this.logger.save(`Connected to the lobby[${lobbyId}] as ${player.name}.`);
                    break;
                case WsTitle.Started:
                    this.platform.navigatorModal.hide();
                    const playerColor = (wsData as WsStartedData).whitePlayer.id === player!.id ? Color.White : Color.Black;
                    this.platform.preparePlatformForOnlineGame(wsData as WsStartedData, playerColor);
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
                    if((wsData as WsFinishedData).isResigned || (wsData as WsFinishedData).isDrawOffered){
                        this.chess.engine.setGameStatus((wsData as WsFinishedData).gameStatus);
                        this.chess.finishTurn();
                        if((wsData as WsFinishedData).isResigned)
                            this.platform.navigatorModal.showGameOverAsResigned((wsData as WsFinishedData).resignColor!);
                        else if((wsData as WsFinishedData).isDrawOffered)
                            this.platform.navigatorModal.showGameOverAsDrawAccepted();
                    }
                    else if(this.chess.engine.getGameStatus() !== (wsData as WsFinishedData).gameStatus){
                        this.chess.engine.setGameStatus((wsData as WsFinishedData).gameStatus);
                        this.chess.finishTurn();
                        this.platform.navigatorModal.showError("Unexpected game status. Game status is not equal to the server's game status.");
                        this.logger.save(`Game finished with the status: ${(wsData as WsFinishedData).gameStatus}.`);
                    }
                    closeConnectionOnFinish = true;
                    break;
                case WsTitle.DrawOffered:
                    this.platform.notationMenu.showDrawOffer();
                    break;
                case WsTitle.PlayAgainOffered:
                    this.platform.notationMenu.showPlayAgainOffer();
                    break;
                case WsTitle.SentOfferCancelled:
                    if(![GameStatus.BlackVictory, 
                        GameStatus.WhiteVictory, 
                        GameStatus.Draw
                    ].includes(this.chess.engine.getGameStatus()))
                        this.platform.notationMenu.displayLobbyUtilityMenu();
                    else 
                        this.platform.notationMenu.displayNewGameUtilityMenu();
                    break;
                case WsTitle.SentOfferDeclined:
                    this.platform.notationMenu.displayLobbyUtilityMenu();
                    break;
                case WsTitle.Disconnected:
                    this.platform.notationMenu.updatePlayerAsOffline(
                        (wsData as WsDisconnectedData).color
                    );
                    break;
                case WsTitle.Reconnected:
                    this.platform.notationMenu.updatePlayerAsOnline(
                        (wsData as WsReconnectedData).color
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
                            this.forceClearLastConnection();
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
                this.forceClearLastConnection();
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
     * @example [Resigned]
     */
    private static _wsCommand(title: WsTitle, data: WsData | null = null): string {
        if(Object.values(WsTitle).indexOf(title) === -1) 
            throw new Error("Invalid command.");

        return data ? JSON.stringify([title, data]) : JSON.stringify([title]);
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
     * Send resigned command to the server.
     * @example [RESIGNED, {}]
     */
    static resigned(): string
    {
        return this._wsCommand(WsTitle.Resigned);
    }

    /**
     * Send draw offered command to the server.
     */
    static drawOffered(): string
    {
        return this._wsCommand(WsTitle.DrawOffered);
    }

    /**
     * Send draw accepted command to the server.
     */
    static drawAccepted(): string
    {
        return this._wsCommand(WsTitle.DrawAccepted);
    }

    /**
     * Send play again offered command to the server.
     */
    static playAgainOffered(): string
    {
        return this._wsCommand(WsTitle.PlayAgainOffered);
    }
    
    /**
     * Send play again accepted command to the server.
     */
    static playAgainAccepted(): string
    {
        return this._wsCommand(WsTitle.PlayAgainAccepted);
    }

    /**
     * Send cancel offer command to the server. This command 
     * is used when the user cancels the sent offer like draw
     * or undo move offer.
     */
    static offerCanceled(): string
    {
        return this._wsCommand(WsTitle.OfferCancelled);
    }

    /**
     * Send offer declined command to the server.
     * This command is used when the user declines the
     * sent offer like draw or undo move offer.
     */
    static sentOfferDeclined(): string
    {
        return this._wsCommand(WsTitle.SentOfferDeclined);
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