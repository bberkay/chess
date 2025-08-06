/**
 * @module ChessPlatform
 * @description The main class of the app. It provides the connections between
 * the `Chess` and `Platform` classes and handles the WebSocket connections
 * between the client and server.
 * @url https://github.com/bberkay/chess
 * @author Berkay Kaya <berkaykayaforbusiness@gmail.com> (https://bberkay.github.io)
 * @license MIT
 */

import { Chess } from "@Chess/Chess";
import { Platform } from "@Platform/Platform.ts";
import { Logger } from "@ChessPlatform/Services/Logger/Logger";
import { Store, StoreKey } from "@ChessPlatform/Services/Store";
import { ChessEvent, Color, GameStatus, StartPosition } from "@Chess/Types";
import {
    DEFULT_PLAYER_NAME,
    DEFAULT_TOTAL_TIME,
    DEFAULT_INCREMENT_TIME,
} from "@Platform/Consts";
import { PlatformEvent } from "@Platform/Types";
import type {
    WsConnectedData,
    WsDisconnectedData,
    WsErrorData,
    WsMovedData,
    WsReconnectedData,
    WsStartedData,
    WsFinishedData,
    WsResignedData,
    WsUndoData,
    WsIncomingMessage,
    WsOutgoingMessage,
    Player,
} from "./Types";
import { SocketEvent, SocketOperation, WsTitle } from "./Types";
import { Page } from "@Global/Page";
import {
    ApiService,
    GetRoutes,
    PostRoutes,
} from "./Services/ApiService";
import { createURLFromEntries, getPathSegment, getQueryParam } from "./Utils/url.utils";
import { GetReqScheme, PostReqScheme } from "./Services/ApiService/scheme";

const RECONNECTION_ATTEMPT_LIMIT = 3;
const RECONNECTION_TIMEOUT = 5;

/**
 * `ChessPlatform` is the main class of the app. It provides the connections
 * between the `Chess` and `Platform` classes and handles the WebSocket connections
 * between the client and server.
 */
export class ChessPlatform {
    public readonly chess: Chess;
    public readonly platform: Platform;
    public readonly logger: Logger = new Logger("src/ChessPlatform.ts");

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
                event: CustomEvent,
            ) => {
                if (typeof event.detail.selector === "string") {
                    const socketOperations = document.querySelectorAll(
                        `${event.detail.selector} [data-socket-operation]`,
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
                            "data-socket-operation",
                        )
                    )
                        return;
                    event.detail.selector.addEventListener("click", () => {
                        this.handleSocketOperation(
                            event.detail.selector as HTMLElement,
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
            const urlLobbyId = Page.getEndpoint();
            const storedLobbyId = Store.load(
                StoreKey.LastLobbyConnection,
            )?.lobbyId;
            const lobbyId = urlLobbyId || storedLobbyId;
            if (!lobbyId) return;

            const isLobbyIdValid = await this.checkLobby(
                { lobbyId },
                urlLobbyId !== null,
            );
            if (!isLobbyIdValid) return;

            if (!storedLobbyId || storedLobbyId !== lobbyId) {
                this.platform.navigatorModal.showJoinLobby();
            } else {
                this._reconnectLobby();
            }
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
                event: CustomEvent,
            ) => {
                if (!this.socket) return;
                const { from, to } = event.detail;
                this.socket?.send(WsCommand.create([WsTitle.Moved, { from, to }]));
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
            "data-socket-operation",
        ) as SocketOperation;
        if (
            operation != SocketOperation.CancelLobby &&
            Store.isExist(StoreKey.WasBoardEditorEnabled)
        )
            Store.clear(StoreKey.WasBoardEditorEnabled);

        switch (operation) {
            case SocketOperation.CreateLobby:
                this._createLobby();
                break;
            case SocketOperation.JoinLobby:
                this._connectLobby();
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
            case SocketOperation.DeclineOffer:
                this.declineOffer();
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
    private async checkLobby(
        checkLobbyReqParams: GetReqScheme[GetRoutes.CheckLobby]["request"]["pathParams"],
        showAsError: boolean = true,
    ): Promise<boolean> {
        try {
            this.platform.navigatorModal.showLoading(
                "Checking the lobby id. Please wait...",
            );
            const response = await ApiService.get(
                GetRoutes.CheckLobby,
                checkLobbyReqParams,
                null
            );
            this.platform.navigatorModal.hide();
            if (!response.success) {
                this.terminateConnection();
                if (showAsError)
                    this.platform.navigatorModal.showError(response.message);
            }
            return response.success;
        } catch (error: unknown) {
            this.platform.navigatorModal.hide();
            this.terminateConnection();
            if (showAsError)
                this.platform.navigatorModal.showError(
                    "An error occurred while checking the lobby id: " +
                        (error as Error).message,
                );
            return false;
        }
    }

    /**
     * Establishes a WebSocket connection for creating a new
     * lobby.
     *
     * Parse the data, show the lobby info modal,
     * lobby id on the url and save the last connection
     * to the local storage.
     */
    public async createLobby(
        createLobbyReqParams: PostReqScheme[PostRoutes.CreateLobby]["request"]["body"],
    ): Promise<void> {
        this.platform.navigatorModal.showLoading(
            "Creating a new lobby. Please wait the server to respond...",
        );
        document.dispatchEvent(new Event(SocketEvent.onCreatingLobby));

        const response = await ApiService.post(
            PostRoutes.CreateLobby,
            null,
            createLobbyReqParams,
        );
        if (response.success && response.data) {
            const { lobbyId, player } = response.data;
            this.platform.navigatorModal.showLobbyInfo(
                window.location.origin + "/" + lobbyId,
            );

            Store.save(StoreKey.LastLobbyConnection, response.data);
            Store.save(StoreKey.LastPlayerName, player.name);
            document.dispatchEvent(
                new CustomEvent(SocketEvent.onLobbyCreated, {
                    detail: { lobbyId },
                }),
            );
            this.logger.save(
                `Lobby created and connected-ts-${lobbyId}-te- as ${player.name}.`,
            );

            this.createAndHandleWebSocket(lobbyId, player);
        } else {
            this.platform.navigatorModal.showError(response.message);
        }
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
                Store.load(StoreKey.LastCreatedBoard) || StartPosition.Standard,
            remaining: duration.remaining || DEFAULT_TOTAL_TIME,
            increment: duration.increment || DEFAULT_INCREMENT_TIME,
        });
    }

    /**
     * Establishes a WebSocket connection for joining an existing lobby.
     */
    public async connectLobby(
        connectLobbyReqParams: PostReqScheme[PostRoutes.ConnectLobby]["request"]["body"],
    ): Promise<void> {
        this.platform.navigatorModal.showLoading(
            "Joining the lobby. Please wait the server to respond...",
        );
        document.dispatchEvent(
            new CustomEvent(SocketEvent.onJoiningLobby, {
                detail: { lobbyId: connectLobbyReqParams.lobbyId },
            }),
        );
        const response = await ApiService.post(
            PostRoutes.ConnectLobby,
            null,
            connectLobbyReqParams,
        );
        if (response.success && response.data) {
            const { lobbyId, player } = response.data;

            Store.save(StoreKey.LastLobbyConnection, response.data);
            Store.save(StoreKey.LastPlayerName, player.name);
            document.dispatchEvent(new Event(SocketEvent.onLobbyJoined));
            this.logger.save(
                `Connected to the lobby-ts-${lobbyId}-te- as ${player.name}.`,
            );

            this.createAndHandleWebSocket(lobbyId, player);
        }
    }

    /**
     * Connect to the lobby with the given lobby id and player name
     * that entered by the user using the platform components.
     */
    private _connectLobby(): void {
        const lobbyId = Page.getEndpoint();
        if (!lobbyId) return;

        const playerName = this.platform.navigatorModal.getEnteredPlayerName();
        this.connectLobby({
            name: playerName || DEFULT_PLAYER_NAME,
            lobbyId: lobbyId,
        });
    }

    /**
     * Establishes a WebSocket connection to reconnect to a previously joined lobby.
     * It uses the saved lobby ID and user token to restore the connection.
     */
    private async reconnectLobby(
        reconnectLobbyReqParams: PostReqScheme[PostRoutes.ReconnectLobby]["request"]["body"],
    ): Promise<void> {
        this.platform.navigatorModal.showLoading(
            "Reconnecting to the lobby. Please wait the server to respond...",
        );
        document.dispatchEvent(
            new CustomEvent(SocketEvent.onJoiningLobby, {
                detail: { lobbyId: reconnectLobbyReqParams.lobbyId },
            }),
        );
        const response = await ApiService.post(
            PostRoutes.ReconnectLobby,
            null,
            reconnectLobbyReqParams,
        );
        if (response.success && response.data) {
            const { lobbyId, player } = response.data;

            Store.save(StoreKey.LastLobbyConnection, response.data);
            Store.save(StoreKey.LastPlayerName, player.name);
            document.dispatchEvent(new Event(SocketEvent.onLobbyJoined));
            this.logger.save(
                `Reconnected to the lobby-ts-${lobbyId}-te- as ${player.name}.`,
            );

            this.createAndHandleWebSocket(lobbyId, player);
        }
    }

    /**
     * Reconnect the last lobby that the user connected.
     */
    private _reconnectLobby(): void {
        if (!Store.isExist(StoreKey.LastLobbyConnection)) return;

        const lastLobbyConnection = Store.load(StoreKey.LastLobbyConnection)!;
        this.reconnectLobby({
            lobbyId: lastLobbyConnection.lobbyId,
            playerToken: lastLobbyConnection.player.token,
        });
    }

    /**
     * Cancel the game and close the socket connection
     */
    public cancelLobby(): void {
        Store.clear(StoreKey.LastLobbyConnection);
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
        this.socket?.send(WsCommand.create([WsTitle.Aborted]));
    }

    /**
     * Resign the game and send the resign command to the server.
     */
    public resign(): void {
        this.socket?.send(WsCommand.create([WsTitle.Resigned]));
    }

    /**
     * Send the play again offer to the opponent.
     */
    public sendPlayAgainOffer(): void {
        this.platform.navigatorModal.hide();
        this.platform.notationMenu.showPlayAgainSentFeedback();
        this.socket?.send(WsCommand.create([WsTitle.PlayAgainOffered]));
    }

    /**
     * Send the draw offer to the opponent.
     */
    public sendDrawOffer(): void {
        this.platform.notationMenu.showDrawOfferSentFeedback();
        this.socket?.send(WsCommand.create([WsTitle.DrawOffered]));
    }

    /**
     * Send the undo move offer to the opponent.
     */
    public sendUndoOffer(): void {
        this.platform.notationMenu.showUndoOfferSentFeedback();
        this.socket?.send(WsCommand.create([WsTitle.UndoOffered]));
    }

    /**
     * Accept the draw offer from the opponent.
     */
    public acceptDrawOffer(): void {
        this.socket?.send(WsCommand.create([WsTitle.DrawAccepted]));
    }

    /**
     * Accept the play again offer from the opponent.
     */
    public acceptPlayAgainOffer(): void {
        this.socket?.send(WsCommand.create([WsTitle.PlayAgainAccepted]));
    }

    /**
     * Accept the undo move offer from the opponent.
     */
    public acceptUndoOffer(): void {
        this.socket?.send(WsCommand.create([WsTitle.UndoAccepted]));
        this.platform.notationMenu.goBack();
    }

    /**
     * Cancel the offer that sent to the opponent.
     */
    public cancelOffer(): void {
        this.socket?.send(WsCommand.create([WsTitle.OfferCancelled]));
        this.platform.notationMenu.goBack();
    }

    /**
     * Decline the sent offer from the opponent.
     */
    public declineOffer(): void {
        this.socket?.send(WsCommand.create([WsTitle.OfferDeclined]));
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

        Store.clear(StoreKey.LastLobbyConnection);
        document.dispatchEvent(new Event(SocketEvent.onConnectionTerminated));
        if (resetPlatform) {
            Store.clear(StoreKey.LastBoard);
            this.platform.notationMenu.clear();
        }
    }

    /**
     * Handle the websocket socket connection and listen the
     * messages from the server.
     */
    private createAndHandleWebSocket(lobbyId: string, player: Player): void {
        const createWebSocketUrl = (lobbyId: string, playerToken: string) => {
            return createURLFromEntries(
                import.meta.env.VITE_WS_URL,
                lobbyId,
                { playerToken }
            )
        }

        if (this.socket) {
            this.socket.onclose = () => {
                this.socket = null;
                this.createAndHandleWebSocket(lobbyId, player);
            };
            this.socket.close();
            return;
        }

        const webSocketUrl = createWebSocketUrl(lobbyId, player.token);
        console.log("WebSocket URL:", webSocketUrl);
        this.socket = new WebSocket(webSocketUrl);

        let shouldTerminateConnectionOnClose = false;

        /**
         * Handle the WebSocket connection events.
         */
        this.socket.onopen = () => {
            shouldTerminateConnectionOnClose = false;
            this.reconnectionAttemptRemaining = RECONNECTION_ATTEMPT_LIMIT;
            this.platform.navigatorModal.hide();
        };

        this.socket.onmessage = (event) => {
            //console.log("message:", event.data);
            const [wsTitle, wsData] = WsCommand.parse(event.data);
            switch (wsTitle) {
                case WsTitle.Connected:
                    this._handleConnectedCommand(wsData);
                    break;
                case WsTitle.Disconnected:
                    this._handleDisconnectedCommand(wsData);
                    break;
                case WsTitle.Reconnected:
                    this._handleReconnectedCommand(wsData);
                    break;
                case WsTitle.Started:
                    this._handleStartedCommand(wsData, player);
                    break;
                case WsTitle.Moved:
                    this._handleMovedCommand(wsData);
                    break;
                case WsTitle.Finished:
                    this._handleFinishedCommand(wsData);
                    shouldTerminateConnectionOnClose = true;
                    break;
                case WsTitle.Aborted:
                    this._handleAbortedCommand();
                    shouldTerminateConnectionOnClose = true;
                    break;
                case WsTitle.Resigned:
                    this._handleResignedCommand(wsData);
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
                    this._handleUndoAcceptedCommand(wsData);
                    break;
                case WsTitle.PlayAgainOffered:
                    this._handlePlayAgainOfferedCommand();
                    break;
                case WsTitle.PlayAgainAccepted:
                    break;
                case WsTitle.OfferCancelled:
                    this._handleOfferCancelledCommand();
                    break;
                case WsTitle.OfferDeclined:
                    this._handleOfferDeclinedCommand();
                    break;
                case WsTitle.Error:
                    this._handleErrorCommand(wsData as WsErrorData);
                    break;
                default:
                    throw new Error("Invalid WebSocket command.");
            }
        };

        this.socket.onerror = () => {
            this.platform.navigatorModal.showError(
                `An error occurred on the WebSocket connection. Retrying in <span id='reconnection-counter'></span> seconds...`,
                false,
            );
            this.logger.save(
                "An error occurred on the WebSocket connection. Retrying...",
            );

            let remainingTime = RECONNECTION_TIMEOUT;
            const reconnectionTimeout = document.getElementById(
                "reconnection-counter",
            );
            if (!reconnectionTimeout) return;
            const interval = window.setInterval(() => {
                if (remainingTime === 0) {
                    reconnectionTimeout.innerText = "Reconnecting...";
                    remainingTime = RECONNECTION_TIMEOUT;
                    clearInterval(interval);
                    const timeout = window.setTimeout(() => {
                        this.platform.navigatorModal.hide();
                        if (this.reconnectionAttemptRemaining > 0) {
                            this.reconnectionAttemptRemaining--;
                            this.createAndHandleWebSocket(
                                lobbyId, player
                            );
                        } else {
                            this.platform.navigatorModal.showError(
                                "There is a problem with the WebSocket connection. Please try again later.",
                            );
                            this.logger.save(
                                "There is a problem with the WebSocket connection. Please try again later.",
                            );
                            this.terminateConnection();
                        }
                        clearTimeout(timeout);
                    }, RECONNECTION_TIMEOUT);
                }
                reconnectionTimeout.innerText = remainingTime.toString();
                remainingTime -= 1;
            }, 1000);
        };

        this.socket.onclose = () => {
            if (shouldTerminateConnectionOnClose) {
                this.terminateConnection();
                shouldTerminateConnectionOnClose = false;
            }
        };
    }

    /**
     * Resynchronize the game due to the mismatched status
     * between the client and server. This function recreates
     * the websocket connection and displays an error message
     * about the mismatched status.
     */
    private resyncGameDueToMismatchedStatus(): void {
        if (!this.socket) return;
        this.reconnectLobby({
            lobbyId: getPathSegment(this.socket.url) || "",
            playerToken: getQueryParam(this.socket.url, "playerToken") || ""
        });
        this.platform.navigatorModal.showError(
            "Unexpected game status. Game status is not equal to the server's game status. The game created again according to the server's game status.",
        );
    }

    /**
     * Handle the WsTitle.Connected command
     * that is received from the server.
     *
     * Get the player.
     */
    private _handleConnectedCommand(wsConnectedData: WsConnectedData): WsConnectedData {
        return wsConnectedData;
    }

    /**
     * Handle the WsTitle.Disconnected command
     * that is received from the server.
     *
     * Update the player as offline on the notation menu.
     */
    private _handleDisconnectedCommand(
        wsDisconnectedData: WsDisconnectedData,
    ): void {
        this.platform.notationMenu.updatePlayerAsOffline(
            wsDisconnectedData.color,
        );
    }

    /**
     * Handle the WsTitle.Reconnected command
     * that is received from the server.
     *
     * Update the player as online on the notation menu.
     */
    private _handleReconnectedCommand(
        wsReconnectedData: WsReconnectedData,
    ): void {
        this.platform.notationMenu.updatePlayerAsOnline(
            wsReconnectedData.color,
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
        player: Player,
    ): void {
        const playerColor = wsStartedData.players.White.id === player.id
            ? Color.White
            : Color.Black
        this.platform.preparePlatformForOnlineGame(
            wsStartedData,
            playerColor
        );
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
            }),
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
    private _handleFinishedCommand(wsFinishedData: WsFinishedData): void {
        if (this.chess.getGameStatus() !== wsFinishedData.gameStatus)
            this.resyncGameDueToMismatchedStatus();
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
                : Color.White,
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
    private _handleUndoAcceptedCommand(wsUndoData: WsUndoData): void {
        this.platform.notationMenu.goBack();
        this.chess.takeBack(true, wsUndoData.undoColor);
        if (wsUndoData.board !== this.chess.getGameAsFenNotation())
            this.resyncGameDueToMismatchedStatus();
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
     * Handle the WsTitle.OfferDeclined command
     * that is received from the server.
     *
     * Go back to the notation menu.
     */
    private _handleOfferDeclinedCommand(): void {
        this.platform.notationMenu.goBack();
    }

    /**
     * Handle the WsTitle.OfferCancelled command
     * that is received from the server.
     *
     * Go back to the notation menu.
     */
    private _handleOfferCancelledCommand(): void {
        this._handleOfferDeclinedCommand();
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
 * to send to the server.
 */
export class WsCommand {
    /**
     * Create a WebSocket command with the given command and data.
     * @example [Moved, {from: Square.a2, to: Square.a4}]
     * @example [Resigned]
     */
    static create(wsMessage: WsOutgoingMessage): string {
        return JSON.stringify(wsMessage);
    }

    /**
     * Parse the websocket message from the server.
     * @param message "[Moved, {from: Square.a2, to: Square.a4}]"
     * @example [Moved, {from: Square.a2, to: Square.a4}]
     */
    static parse(message: string): WsIncomingMessage {
        try {
            const parsed = JSON.parse(message);

            if (!Array.isArray(parsed)) {
                throw new Error("Invalid message format");
            }

            return parsed as WsIncomingMessage;
        } catch (error: unknown) {
            throw new Error(
                "Invalid WebSocket message, the message could not be parsed: " +
                    (error instanceof Error ? error.message : ""),
            );
        }
    }
}
