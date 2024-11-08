/**
 * @module ChessPlatform
 * @description The main class of the app. It provides the connections between
 * the `Chess` and `Platform` classes and handles the WebSocket connections
 * between the client and server.
 * @url https://github.com/bberkay/chess
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @license MIT
 */

import { Chess } from "@Chess/Chess";
import { Platform } from "@Platform/Platform.ts";
import { Logger } from "@Services/Logger";
import { Storage, StorageKey } from "@Services/Storage";
import { ChessEvent, Color, GameStatus, StartPosition } from "@Chess/Types";
import {
    DEFULT_PLAYER_NAME,
    DEFAULT_TOTAL_TIME,
    DEFAULT_INCREMENT_TIME,
} from "@Platform/Consts";
import { PlatformEvent } from "@Platform/Types";
import type {
    CreateLobbyReqParams,
    Player,
    WsData,
    WsConnectedData,
    WsDisconnectedData,
    WsErrorData,
    WsMovedData,
    WsReconnectedData,
    WsStartedData,
    JoinLobbyReqParams,
    ReconnectLobbyReqParams,
    WsFinishedData,
    WsResignedData,
    WsUndoData,
    WsCreatedData
} from "./Types";
import {
    RECONNECTION_ATTEMPT_LIMIT,
    RECONNECTION_TIMEOUT,
    SERVER_ADDRESS,
    WS_ADDRESS,
    WS_ENDPOINT_MAX_LENGTH,
} from "./Consts";
import { SocketEvent, SocketOperation, WsTitle } from "./Types";
import { Page } from "@Global/Page";

/**
 * `ChessPlatform` is the main class of the app. It provides the connections
 * between the `Chess` and `Platform` classes and handles the WebSocket connections
 * between the client and server.
 */
export class ChessPlatform {
    public readonly chess: Chess;
    public readonly platform: Platform;
    public readonly logger: Logger = new Logger("src/ChessPlatform.ts");

    private _onOpen: (() => void) | null = null;
    private _onMessage: (<T extends WsTitle>(wsTitle: T, wsData: WsData<T>) => void) |
        null = null;
    private _onError: (() => void) | null = null;
    private _onClose: (() => void) | null = null;

    private socket: WebSocket | null = null;
    private reconnectionAttemptRemaining: number = RECONNECTION_ATTEMPT_LIMIT;

    /**
     * Constructor of the ChessPlatform class.
     */
    constructor() {
        Page.initEventListeners();
        this.chess = new Chess();
        this.platform = new Platform(this.chess);
        this.init();
    }

    /**
     * Initialize the chess platform.
     */
    private init(): void {
        /**
         * Find the socket operations and bind them to the menu
         * items. When the user clicks on the menu item, the
         * operation will be executed.
         */
        const bindSocketOperations = () => {
            document
                .querySelectorAll("[data-socket-operation]")
                .forEach((menuItem) => {
                    menuItem.addEventListener("click", () => {
                        this.handleSocketOperation(menuItem as HTMLElement);
                    });
                });

            document.addEventListener(PlatformEvent.onOperationMounted, ((
                event: CustomEvent
            ) => {
                if (typeof event.detail.selector === "string") {
                    const socketOperations = document.querySelectorAll(
                        `${event.detail.selector} [data-socket-operation]`
                    );
                    if (!socketOperations) return;
                    socketOperations.forEach((menuItem) => {
                        menuItem.addEventListener("click", () => {
                            this.handleSocketOperation(menuItem as HTMLElement);
                        });
                    });
                } else if (event.detail.selector instanceof HTMLElement) {
                    if (
                        !event.detail.selector.hasAttribute(
                            "data-socket-operation"
                        )
                    )
                        return;
                    event.detail.selector.addEventListener("click", () => {
                        this.handleSocketOperation(
                            event.detail.selector as HTMLElement
                        );
                    });
                }
            }) as EventListener);

            this.logger.save("Socket operations are bound to the menu items.");
        };

        /**
         * Connect to the last connection if exists.
         */
        const connectToLastConnectionOrLobbyUrl = async () => {
            const lsLobbyId = Storage.load(
                StorageKey.LastLobbyConnection
            )?.lobbyId;
            const urlLobbyId = Page.getEndpoint();
            const lobbyId = urlLobbyId || lsLobbyId;
            if (!lobbyId) return;

            const isLobbyIdValid = await this.checkLobbyId(
                lobbyId,
                urlLobbyId !== null
            );
            if (!isLobbyIdValid) return;

            if (!lsLobbyId || lsLobbyId !== lobbyId) {
                this.platform.navigatorModal.showJoinLobby();
            } else this._reconnectLobby();
        };

        /**
         * Create necessary event listeners for the chess
         * platform.
         */
        const createEventListeners = () => {
            window.addEventListener("beforeunload", (event) => {
                if (
                    this.socket &&
                    [
                        GameStatus.BlackInCheck,
                        GameStatus.WhiteInCheck,
                        GameStatus.InPlay,
                    ].includes(this.chess.getGameStatus())
                ) {
                    event.preventDefault();
                    event.returnValue = "";
                }
            });

            document.addEventListener(PlatformEvent.onBoardCreated, (() => {
                this.terminateConnection(false);
            }) as EventListener);

            document.addEventListener(ChessEvent.onPieceMovedByPlayer, ((
                event: CustomEvent
            ) => {
                if (!this.socket) return;
                const { from, to } = event.detail;
                this.socket?.send(WsCommand.moved({ from, to }));
            }) as EventListener);
        };

        /**
         * Initialize the chess platform.
         */
        connectToLastConnectionOrLobbyUrl();
        bindSocketOperations();
        createEventListeners();
        this.logger.save("Chess platform is initialized.");
    }

    /**
     * Handle the socket operation of the given socket operation item.
     */
    private handleSocketOperation(socketOperationItem: HTMLElement): void {
        const operation = socketOperationItem.getAttribute(
            "data-socket-operation"
        ) as SocketOperation;
        if (
            operation != SocketOperation.CancelLobby &&
            Storage.isExist(StorageKey.WasBoardEditorEnabled)
        )
            Storage.clear(StorageKey.WasBoardEditorEnabled);

        switch (operation) {
            case SocketOperation.CreateLobby:
                this._createLobby();
                break;
            case SocketOperation.JoinLobby:
                this._joinLobby();
                break;
            case SocketOperation.CancelLobby:
                this.cancelLobby();
                break;
            case SocketOperation.AbortGame:
                this.abortGame();
                break;
            case SocketOperation.Resign:
                this.resign();
                break;
            case SocketOperation.SendPlayAgainOffer:
                this.sendPlayAgainOffer();
                break;
            case SocketOperation.SendUndoOffer:
                this.sendUndoOffer();
                break;
            case SocketOperation.SendDrawOffer:
                this.sendDrawOffer();
                break;
            case SocketOperation.AcceptDrawOffer:
                this.acceptDrawOffer();
                break;
            case SocketOperation.AcceptUndoOffer:
                this.acceptUndoOffer();
                break;
            case SocketOperation.AcceptPlayAgainOffer:
                this.acceptPlayAgainOffer();
                break;
            case SocketOperation.DeclineSentOffer:
                this.declineSentOffer();
                break;
            case SocketOperation.CancelOffer:
                this.cancelOffer();
                break;
        }
    }

    /**
     * Add custom callbacks to the WebSocket events. Does not
     * override the default callbacks.
     */
    public bindSocketOperationCallbacks(
        onOpen: (() => void) | null = null,
        onMessage: (<T extends WsTitle>(wsTitle: T, wsData: WsData<T>) => void) | null = null,
        onError: (() => void) | null = null,
        onClose: (() => void) | null = null
    ): void {
        this._onOpen = onOpen;
        this._onMessage = onMessage;
        this._onError = onError;
        this._onClose = onClose;
    }

    /**
     * Check the lobby id from the URL and return it if it exists
     * and is valid.
     */
    private async checkLobbyId(
        lobbyId: string,
        showAsError: boolean = true
    ): Promise<string | null> {
        try {
            this.platform.navigatorModal.showLoading(
                "Checking the lobby id. Please wait..."
            );
            const response = await fetch(
                SERVER_ADDRESS + "?lobbyId=" + lobbyId
            );
            this.platform.navigatorModal.hide();
            if (!response.ok) {
                this.terminateConnection();
                const error = await response.text();
                if (showAsError) this.platform.navigatorModal.showError(error);
                return null;
            }
        } catch (error: unknown) {
            this.platform.navigatorModal.hide();
            this.terminateConnection();
            if (showAsError)
                this.platform.navigatorModal.showError(
                    "An error occurred while checking the lobby id: " +
                        (error as Error).message
                );
            return null;
        }

        return lobbyId;
    }

    /**
     * Establishes a WebSocket connection for creating a new lobby.
     */
    public createLobby(createLobbyReqParams: CreateLobbyReqParams): void {        
        this.platform.navigatorModal.showLoading(
            "Creating a new lobby. Please wait the server to respond..."
        );

        this.createAndHandleWebSocket(
            new URLSearchParams(Object.entries(createLobbyReqParams)).toString()
        );

        document.dispatchEvent(new Event(SocketEvent.onCreatingLobby));
    }

    /**
     * Create a new lobby with the created settings using the
     * platform components like board editor and navigator modal.
     */
    private _createLobby(): void {
        const { playerName, duration } =
            this.platform.navigatorModal.getCreatedLobbySettings();
        this.createLobby({
            name: playerName || DEFULT_PLAYER_NAME,
            board:
                this.platform.boardEditor.getCreatedBoard() ||
                StartPosition.Standard,
            remaining: (duration.remaining || DEFAULT_TOTAL_TIME).toString(),
            increment: (
                duration.increment || DEFAULT_INCREMENT_TIME
            ).toString(),
        } as CreateLobbyReqParams);
    }

    /**
     * Establishes a WebSocket connection for joining an existing lobby.
     */
    public joinLobby(joinLobbyReqParams: JoinLobbyReqParams): void {
        this.platform.navigatorModal.showLoading(
            "Joining the lobby. Please wait the server to respond..."
        );

        this.createAndHandleWebSocket(
            new URLSearchParams(Object.entries(joinLobbyReqParams)).toString()
        );

        document.dispatchEvent(
            new CustomEvent(SocketEvent.onJoiningLobby, {
                detail: joinLobbyReqParams.lobbyId,
            })
        );
    }

    /**
     * Connect to the lobby with the given lobby id and player name
     * that entered by the user using the platform components.
     */
    private _joinLobby(): void {
        const lobbyId = Page.getEndpoint();
        if (!lobbyId) return;

        const playerName = this.platform.navigatorModal.getEnteredPlayerName();
        this.joinLobby({
            name: playerName || DEFULT_PLAYER_NAME,
            lobbyId: lobbyId,
        } as JoinLobbyReqParams);
    }

    /**
     * Establishes a WebSocket connection to reconnect to a previously joined lobby.
     * It uses the saved lobby ID and user token to restore the connection.
     */
    private reconnectLobby(
        reconnectLobbyReqParams: ReconnectLobbyReqParams
    ): void {
        this.platform.navigatorModal.showLoading(
            "Reconnecting to the lobby. Please wait the server to respond..."
        );

        this.createAndHandleWebSocket(
            new URLSearchParams(
                Object.entries(reconnectLobbyReqParams)
            ).toString()
        );

        document.dispatchEvent(
            new CustomEvent(SocketEvent.onJoiningLobby, {
                detail: reconnectLobbyReqParams.lobbyId
            })
        );
    }

    /**
     * Reconnect the last lobby that the user connected.
     */
    private _reconnectLobby(): void {
        if (!Storage.isExist(StorageKey.LastLobbyConnection)) return;

        const lastLobbyConnection = Storage.load(
            StorageKey.LastLobbyConnection
        ) as WsCreatedData;
        this.reconnectLobby({
            lobbyId: lastLobbyConnection.lobbyId,
            token: lastLobbyConnection.player.token,
        } as ReconnectLobbyReqParams);
    }

    /**
     * Cancel the game and close the socket connection
     */
    public cancelLobby(): void {
        Storage.clear(StorageKey.LastLobbyConnection);
        this.platform.navigatorModal.hide();
        this.terminateConnection();
        this.platform.notationMenu.displayNewGameUtilityMenu();
        this.chess.board.lock();
        document.dispatchEvent(new Event(SocketEvent.onLobbyCancelled));
    }

    /**
     * Abort the game and send the abort command to the server.
     */
    public abortGame(): void {
        this.socket?.send(WsCommand.aborted());
    }

    /**
     * Resign the game and send the resign command to the server.
     */
    public resign(): void {
        this.socket?.send(WsCommand.resigned());
    }

    /**
     * Send the play again offer to the opponent.
     */
    public sendPlayAgainOffer(): void {
        this.platform.navigatorModal.hide();
        this.platform.notationMenu.showPlayAgainSentFeedback();
        this.socket?.send(WsCommand.playAgainOffered());
    }

    /**
     * Send the draw offer to the opponent.
     */
    public sendDrawOffer(): void {
        this.platform.notationMenu.showDrawOfferSentFeedback();
        this.socket?.send(WsCommand.drawOffered());
    }

    /**
     * Send the undo move offer to the opponent.
     */
    public sendUndoOffer(): void {
        this.platform.notationMenu.showUndoOfferSentFeedback();
        this.socket?.send(WsCommand.undoOffered());
    }

    /**
     * Accept the draw offer from the opponent.
     */
    public acceptDrawOffer(): void {
        this.socket?.send(WsCommand.drawAccepted());
    }

    /**
     * Accept the play again offer from the opponent.
     */
    public acceptPlayAgainOffer(): void {
        this.socket?.send(WsCommand.playAgainAccepted());
    }

    /**
     * Accept the undo move offer from the opponent.
     */
    public acceptUndoOffer(): void {
        this.socket?.send(WsCommand.undoAccepted());
        this.platform.notationMenu.goBack();
    }

    /**
     * Cancel the offer that sent to the opponent.
     */
    public cancelOffer(): void {
        this.socket?.send(WsCommand.offerCanceled());
        this.platform.notationMenu.goBack();
    }

    /**
     * Decline the sent offer from the opponent.
     */
    public declineSentOffer(): void {
        this.socket?.send(WsCommand.sentOfferDeclined());
        this.platform.notationMenu.goBack();
    }

    /**
     * Clear the last connection completely and display the
     * new game utility menu.
     *
     * @param resetPlatform If true, it will make the platform ready
     * for a new game by clearing the last board and displaying the
     * new game utility menu.
     */
    public terminateConnection(resetPlatform: boolean = true): void {
        if (this.socket) {
            this.socket.onclose = () => {
                this.socket = null;
                this.terminateConnection(resetPlatform);
            };
            this.socket.close();
            return;
        }

        Storage.clear(StorageKey.LastLobbyConnection);
        document.dispatchEvent(new Event(SocketEvent.onConnectionTerminated));
        if (resetPlatform) {
            Storage.clear(StorageKey.LastBoard);
            this.platform.notationMenu.clear();
        }
    }

    /**
     * Resynchronize the game due to the mismatched status
     * between the client and server. This function recreates
     * the websocket connection and displays an error message
     * about the mismatched status.
     */
    private resyncGameDueToMismatchedStatus(webSocketEndpoint: string): void {
        this.createAndHandleWebSocket(webSocketEndpoint);
        this.platform.navigatorModal.showError(
            "Unexpected game status. Game status is not equal to the server's game status. The game created again according to the server's game status."
        );
    }

    /**
     * Handle the websocket socket connection and listen the
     * messages from the server.
     */
    private createAndHandleWebSocket(webSocketEndpoint: string): void {
        if (webSocketEndpoint.length > Number(WS_ENDPOINT_MAX_LENGTH))
            throw new Error("The WebSocket URL is too long.");

        if (this.socket) {
            this.socket.onclose = () => {
                this.socket = null;
                this.createAndHandleWebSocket(webSocketEndpoint);
            };
            this.socket.close();
            return;
        }

        const webSocketUrl =
            WS_ADDRESS + (webSocketEndpoint ? "?" + webSocketEndpoint : "");
        //console.log("WebSocket URL:", webSocketUrl);
        this.socket = new WebSocket(webSocketUrl);

        let player: Player | null = null;
        let shouldTerminateConnectionOnClose = false;

        /**
         * Handle the WebSocket connection events.
         */
        this.socket.onopen = () => {
            player = null;
            shouldTerminateConnectionOnClose = false;
            this.reconnectionAttemptRemaining = RECONNECTION_ATTEMPT_LIMIT;
            this.platform.navigatorModal.hide();
            if (this._onOpen !== null) this._onOpen();
        };

        this.socket.onmessage = (event) => {
            //console.log("message:", event.data);
            const [wsTitle, wsData] = WsCommand.parse(event.data);
            switch (wsTitle) {
                case WsTitle.Created:
                    ({ player } = this._handleCreatedCommand(
                        wsData as WsCreatedData
                    ));
                    break;
                case WsTitle.Connected:
                    ({ player } = this._handleConnectedCommand(
                        wsData as WsConnectedData
                    ));
                    break;
                case WsTitle.Disconnected:
                    this._handleDisconnectedCommand(
                        wsData as WsDisconnectedData
                    );
                    break;
                case WsTitle.Reconnected:
                    this._handleReconnectedCommand(wsData as WsReconnectedData);
                    break;
                case WsTitle.Started:
                    this._handleStartedCommand(
                        wsData as WsStartedData,
                        player!
                    );
                    break;
                case WsTitle.Moved:
                    this._handleMovedCommand(wsData as WsMovedData);
                    break;
                case WsTitle.Finished:
                    this._handleFinishedCommand(
                        wsData as WsFinishedData,
                        webSocketEndpoint
                    );
                    shouldTerminateConnectionOnClose = true;
                    break;
                case WsTitle.Aborted:
                    this._handleAbortedCommand();
                    shouldTerminateConnectionOnClose = true;
                    break;
                case WsTitle.Resigned:
                    this._handleResignedCommand(wsData as WsResignedData);
                    shouldTerminateConnectionOnClose = true;
                    break;
                case WsTitle.DrawOffered:
                    this._handleDrawOfferedCommand();
                    break;
                case WsTitle.DrawAccepted:
                    this._handleDrawAcceptedCommand();
                    shouldTerminateConnectionOnClose = true;
                    break;
                case WsTitle.UndoOffered:
                    this._handleUndoOfferedCommand();
                    break;
                case WsTitle.UndoAccepted:
                    this._handleUndoAcceptedCommand(
                        wsData as WsUndoData,
                        webSocketEndpoint
                    );
                    break;
                case WsTitle.PlayAgainOffered:
                    this._handlePlayAgainOfferedCommand();
                    break;
                case WsTitle.PlayAgainAccepted:
                    this._handlePlayAgainAcceptedCommand(
                        wsData as WsStartedData,
                        player!
                    );
                    break;
                case WsTitle.SentOfferDeclined:
                    this._handleSentOfferDeclinedCommand();
                    break;
                case WsTitle.SentOfferCancelled:
                    this._handleSentOfferCancelledCommand();
                    break;
                case WsTitle.Error:
                    this._handleErrorCommand(wsData as WsErrorData);
                    break;
                default:
                    throw new Error("Invalid WebSocket command.");
            }

            if (this._onMessage !== null) this._onMessage(wsTitle, wsData);
        };

        this.socket.onerror = () => {
            this.platform.navigatorModal.showError(
                `An error occurred on the WebSocket connection. Retrying in <span id='reconnection-counter'></span> seconds...`,
                false
            );
            this.logger.save(
                "An error occurred on the WebSocket connection. Retrying..."
            );

            let remainingTime = RECONNECTION_TIMEOUT;
            const reconnectionTimeout = document.getElementById(
                "reconnection-counter"
            );
            if (reconnectionTimeout) {
                const interval = window.setInterval(() => {
                    if (remainingTime === 0 || !reconnectionTimeout) {
                        reconnectionTimeout.innerText = "Reconnecting...";
                        clearInterval(interval);
                        remainingTime = RECONNECTION_TIMEOUT;
                        const timeout = window.setTimeout(() => {
                            this.platform.navigatorModal.hide();
                            if (this.reconnectionAttemptRemaining > 0) {
                                this.reconnectionAttemptRemaining--;
                                this.createAndHandleWebSocket(
                                    webSocketEndpoint
                                );
                            } else {
                                this.platform.navigatorModal.showError(
                                    "There is a problem with the WebSocket connection. Please try again later."
                                );
                                this.logger.save(
                                    "There is a problem with the WebSocket connection. Please try again later."
                                );
                                this.terminateConnection();
                                if (this._onError !== null) this._onError();
                            }
                            clearTimeout(timeout);
                        }, RECONNECTION_TIMEOUT);
                    }
                    reconnectionTimeout.innerText = remainingTime.toString();
                    remainingTime -= 1;
                }, 1000);
            }
        };

        this.socket.onclose = () => {
            if (shouldTerminateConnectionOnClose) {
                this.terminateConnection();
                shouldTerminateConnectionOnClose = false;
                if (this._onClose !== null) this._onClose();
            }
        };
    }

    /**
     * Handle the WsTitle.Created command
     * that is received from the server.
     *
     * Parse the data, show the lobby info modal,
     * lobby id on the url and save the last connection
     * to the local storage.
     */
    private _handleCreatedCommand(wsCreatedData: WsCreatedData): {
        lobbyId: string;
        player: Player;
    } {
        const { lobbyId, player } = wsCreatedData;
        this.platform.navigatorModal.showLobbyInfo(
            window.location.origin + "/" + lobbyId
        );
        
        Storage.save(StorageKey.LastLobbyConnection, wsCreatedData);
        Storage.save(StorageKey.LastPlayerName, player.name);
        document.dispatchEvent(
            new CustomEvent(SocketEvent.onLobbyCreated, {
                detail: lobbyId,
            })
        );
        this.logger.save(
            `Lobby created and connected-ts-${lobbyId}-te- as ${player.name}.`
        );
        return { lobbyId, player };
    }

    /**
     * Handle the WsTitle.Connected command
     * that is received from the server.
     *
     * Parse the data, show the lobby info modal,
     * lobby id on the url and save the last connection
     * to the local storage.
     */
    private _handleConnectedCommand(wsConnectedData: WsConnectedData): {
        lobbyId: string;
        player: Player;
    } {
        const { lobbyId, player } = wsConnectedData;
        Storage.save(StorageKey.LastLobbyConnection, wsConnectedData);
        Storage.save(StorageKey.LastPlayerName, player.name);
        document.dispatchEvent(new Event(SocketEvent.onLobbyJoined));
        this.logger.save(
            `Connected to the lobby-ts-${lobbyId}-te- as ${player.name}.`
        );
        return { lobbyId, player };
    }

    /**
     * Handle the WsTitle.Disconnected command
     * that is received from the server.
     *
     * Update the player as offline on the notation menu.
     */
    private _handleDisconnectedCommand(
        wsDisconnectedData: WsDisconnectedData
    ): void {
        this.platform.notationMenu.updatePlayerAsOffline(
            wsDisconnectedData.color
        );
    }

    /**
     * Handle the WsTitle.Reconnected command
     * that is received from the server.
     *
     * Update the player as online on the notation menu.
     */
    private _handleReconnectedCommand(
        wsReconnectedData: WsReconnectedData
    ): void {
        this.platform.notationMenu.updatePlayerAsOnline(
            wsReconnectedData.color
        );
    }

    /**
     * Handle the WsTitle.Started command
     * that is received from the server.
     *
     * Prepare the platform for the online game,
     * and add the event listener that listens
     * the player's move, sends it to the server
     * and locks the board.
     */
    private _handleStartedCommand(
        wsStartedData: WsStartedData,
        player: Player
    ): void {
        const playerColor =
            wsStartedData.whitePlayer.id === player!.id
                ? Color.White
                : Color.Black;
        this.platform.preparePlatformForOnlineGame(wsStartedData, playerColor);
    }

    /**
     * Handle the WsTitle.Moved command
     * that is received from the server.
     *
     * Unlock the board, play the move and
     * dispatch the event that the piece is
     * moved by the opponent.
     */
    private _handleMovedCommand(wsMovedData: WsMovedData): void {
        this.chess.board.unlock();
        this.chess.playMove(wsMovedData.from, wsMovedData.to);
        document.dispatchEvent(
            new CustomEvent(ChessEvent.onPieceMovedByOpponent, {
                detail: wsMovedData,
            })
        );
    }

    /**
     * Handle the WsTitle.Finished command
     * that is received from the server.
     *
     * Check the game status and resynchronize the
     * game if there is a mismatched status between
     * the client and server.
     */
    private _handleFinishedCommand(
        wsFinishedData: WsFinishedData,
        webSocketEndpoint: string
    ): void {
        if (this.chess.getGameStatus() !== wsFinishedData.gameStatus)
            this.resyncGameDueToMismatchedStatus(webSocketEndpoint);
    }

    /**
     * Handle the WsTitle.Aborted command
     * that is received from the server.
     *
     * Set the game status as draw, finish the turn
     * and show the game over modal as aborted.
     */
    private _handleAbortedCommand(): void {
        this.chess.engine.setGameStatus(GameStatus.Draw);
        this.chess.finishTurn();
        this.platform.navigatorModal.showGameOverAsAborted();
    }

    /**
     * Handle the WsTitle.Resigned command
     * that is received from the server.
     *
     * Set the game status as the resigned player's
     * opponent's victory, finish the turn and show
     * the game over modal as resigned.
     */
    private _handleResignedCommand(wsResignedData: WsResignedData): void {
        this.chess.engine.setGameStatus(wsResignedData.gameStatus);
        this.chess.finishTurn();
        this.platform.navigatorModal.showGameOverAsResigned(
            wsResignedData.gameStatus === GameStatus.WhiteVictory
                ? Color.Black
                : Color.White
        );
    }

    /**
     * Handle the WsTitle.UndoOffered command
     * that is received from the server.
     *
     * Show the received undo offer to the user.
     */
    private _handleUndoOfferedCommand(): void {
        this.platform.notationMenu.showReceivedUndoOffer();
    }

    /**
     * Handle the WsTitle.UndoAccepted command
     * that is received from the server.
     *
     * Take back the move, delete the last notation
     * and go back to the notation menu. If there is a
     * mismatched status between the client and server
     * after the undo, resynchronize the game.
     */
    private _handleUndoAcceptedCommand(
        wsUndoData: WsUndoData,
        webSocketEndpoint: string
    ): void {
        this.platform.notationMenu.goBack();
        this.chess.takeBack(true, wsUndoData.undoColor);
        if (wsUndoData.board !== this.chess.getGameAsFenNotation())
            this.resyncGameDueToMismatchedStatus(webSocketEndpoint);
    }

    /**
     * Handle the WsTitle.DrawOffered command
     * that is received from the server.
     *
     * Show the received draw offer to the user.
     */
    private _handleDrawOfferedCommand(): void {
        this.platform.notationMenu.showReceivedDrawOffer();
    }

    /**
     * Handle the WsTitle.DrawAccepted command
     * that is received from the server.
     *
     * Set the game status as draw, finish the turn
     * and show the game over modal as draw accepted.
     */
    private _handleDrawAcceptedCommand(): void {
        this.chess.engine.setGameStatus(GameStatus.Draw);
        this.chess.finishTurn();
        this.platform.navigatorModal.showGameOverAsDrawAccepted();
    }

    /**
     * Handle the WsTitle.PlayAgainOffered command
     * that is received from the server.
     *
     * Show the received play again offer to the user.
     */
    private _handlePlayAgainOfferedCommand(): void {
        this.platform.notationMenu.showReceivedPlayAgainOffer();
    }

    /**
     * Handle the WsTitle.PlayAgainAccepted command
     * that is received from the server.
     *
     * Start the game again.
     */
    private _handlePlayAgainAcceptedCommand(
        wsStartedData: WsStartedData,
        player: Player
    ): void {
        this._handleStartedCommand(wsStartedData, player);
    }

    /**
     * Handle the WsTitle.SentOfferDeclined command
     * that is received from the server.
     *
     * Go back to the notation menu.
     */
    private _handleSentOfferDeclinedCommand(): void {
        this.platform.notationMenu.goBack();
    }

    /**
     * Handle the WsTitle.SentOfferCancelled command
     * that is received from the server.
     *
     * Go back to the notation menu.
     */
    private _handleSentOfferCancelledCommand(): void {
        this._handleSentOfferDeclinedCommand();
    }

    /**
     * Handle the WsTitle.Error command
     * that is received from the server.
     *
     * Show the error message to the user.
     */
    private _handleErrorCommand(wsData: WsErrorData): void {
        this.platform.navigatorModal.showError((wsData as WsErrorData).message);
        this.logger.save(`Error: ${(wsData as WsErrorData).message}`);
    }
}

/**
 * This class is used to create WebSocket commands
 * to send to the client.
 */
class WsCommand {
    /**
     * Create a WebSocket command with the given command and data.
     * @example [Moved, {from: Square.a2, to: Square.a4}]
     * @example [Resigned]
     */
    private static _wsCommand<T extends WsTitle>(
        title: T,
        data: WsData<T> | null = null
    ): string {
        if (Object.values(WsTitle).indexOf(title) === -1)
            throw new Error("Invalid command.");

        return data ? JSON.stringify([title, data]) : JSON.stringify([title]);
    }

    /**
     * Send moved command to the server.
     * @example [MOVED, {from: Square.a2, to: Square.a4}]
     */
    static moved(moveData: WsMovedData): string {
        return this._wsCommand(WsTitle.Moved, moveData);
    }

    /**
     * Send aborted command to the server.
     * @example [ABORTED, {}]
     */
    static aborted(): string {
        return this._wsCommand(WsTitle.Aborted);
    }

    /**
     * Send resigned command to the server.
     * @example [RESIGNED, {}]
     */
    static resigned(): string {
        return this._wsCommand(WsTitle.Resigned);
    }

    /**
     * Send draw offered command to the server.
     */
    static drawOffered(): string {
        return this._wsCommand(WsTitle.DrawOffered);
    }

    /**
     * Send undo offered command to the server.
     */
    static undoOffered(): string {
        return this._wsCommand(WsTitle.UndoOffered);
    }

    /**
     * Send draw accepted command to the server.
     */
    static drawAccepted(): string {
        return this._wsCommand(WsTitle.DrawAccepted);
    }

    /**
     * Send undo accepted command to the server.
     */
    static undoAccepted(): string {
        return this._wsCommand(WsTitle.UndoAccepted);
    }

    /**
     * Send play again offered command to the server.
     */
    static playAgainOffered(): string {
        return this._wsCommand(WsTitle.PlayAgainOffered);
    }

    /**
     * Send play again accepted command to the server.
     */
    static playAgainAccepted(): string {
        return this._wsCommand(WsTitle.PlayAgainAccepted);
    }

    /**
     * Send cancel offer command to the server. This command
     * is used when the user cancels the sent offer like draw
     * or undo move offer.
     */
    static offerCanceled(): string {
        return this._wsCommand(WsTitle.OfferCancelled);
    }

    /**
     * Send offer declined command to the server.
     * This command is used when the user declines the
     * sent offer like draw or undo move offer.
     */
    static sentOfferDeclined(): string {
        return this._wsCommand(WsTitle.SentOfferDeclined);
    }

    /**
     * Parse the websocket message from the server.
     * @param message "[Moved, {from: Square.a2, to: Square.a4}]"
     * @example [Moved, {from: Square.a2, to: Square.a4}]
     */
    static parse<T extends WsTitle>(message: string): [T, WsData<T>] {
        try {
            return JSON.parse(message) as [T, WsData<T>];
        } catch (error: unknown) {
            throw new Error(
                "Invalid WebSocket message, the message could not be parsed: " +
                    (error instanceof Error ? error.message : "")
            );
        }
    }
}
