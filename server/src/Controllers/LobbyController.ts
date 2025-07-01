import type { Server } from "bun";
import type { RWebSocket, Player } from "../Types";
import { WsTitle, WsStartedData, WsMovedData } from "../Types";
import type { Square } from "@Chess/Types";
import { Color } from "@Chess/Types";
import { LobbyManager } from "../Managers/LobbyManager";
import { SocketManager } from "../Managers/SocketManager";
import { Lobby } from "../Lobby";
import { WsCommand } from "./WsCommand";

/**
 * Handles WebSocket communication for the chess lobby system.
 *
 * This class is responsible for:
 * - Managing WebSocket connections (open, message, close)
 * - Joining and leaving lobbies
 * - Starting and controlling game sessions
 * - Handling in-game commands (move, resign, draw, undo, etc.)
 * - Monitoring game timers and managing game state
 *
 * The server must be upgraded via {@link upgradeServer} before any game session
 * or message handling logic can be used.
 *
 * Typical usage:
 * ```ts
 * const controller = new LobbyController();
 * const server = Bun.serve({
 *   websocket: {
 *     ...controller.expose(),
 *   },
 * });
 * controller.upgradeServer(server);
 * ```
 */
export class LobbyController {
    private _server: Server | null;

    constructor() {
        this._server = null;
    }

    /**
     * Upgrade the server instance.
     * This must be called before using any method that relies on the server (like publish).
     */
    public upgradeServer(server: Server) {
        this._server = server;
    }

    /**
     * Check whether the server instance has been upgraded.
     */
    public isServerUpgraded(): boolean {
        return !!this._server;
    }

    /**
     * Expose the WebSocket lifecycle handlers (open, message, close)
     * to be used in Bun.serve's `websocket` option.
     */
    public expose(): {
        open(ws: RWebSocket): void;
        message(ws: RWebSocket, message: string): void;
        close(ws: RWebSocket): void;
    } {
        return {
            open: (ws: RWebSocket) => this._joinLobby(ws),
            close: (ws: RWebSocket) => this._leaveLobby(ws),
            message: (ws: RWebSocket, message: string) =>
                this._handleCommand(ws, message),
        };
    }

    /**
     * Internal method to ensure the server has been upgraded before using server-dependent logic.
     * Throws an error if the server is not upgraded.
     */
    private _checkServer(): void {
        if (!this.isServerUpgraded())
            throw new Error(
                "Server not upgraded, Use upgradeServer() before invoking this method.",
            );
    }

    /**
     * Internal method to validate that the provided WebSocket matches the one
     * registered in the SocketManager for the given player.
     *
     * This prevents spoofed or reused sockets from interfering with valid sessions.
     */
    private _checkSocket(ws: RWebSocket): void {
        const originalSocket = SocketManager.getSocket(
            ws.data.lobbyId,
            ws.data.player.token,
        );
        if (originalSocket !== ws)
            throw new Error(
                "WebSocket does not match the registered socket for this player.",
            );
    }

    /**
     * Join the lobby and start the game if the lobby is ready.
     * Send connected command to the client.
     */
    private _joinLobby(ws: RWebSocket): void {
        try {
            const lobbyId = ws.data.lobbyId;
            const player = ws.data.player;

            let isLobbyJustCreated = false;
            const lobby = LobbyManager.getLobby(lobbyId);
            if (!lobby) {
                ws.send(WsCommand.error({ message: "Lobby not found." }));
                return;
            }
            isLobbyJustCreated =
                !lobby.isBothPlayersOnline() && !lobby.isGameStarted();
            console.log("Is Lobby Just Created: ", isLobbyJustCreated);
            if (LobbyManager.joinLobby(lobbyId, player)) {
                console.log("Connection opened: ", lobbyId, player.name);
                ws.subscribe(lobbyId);
                ws.send(
                    isLobbyJustCreated
                        ? WsCommand.created({ lobbyId, player })
                        : WsCommand.connected({ lobbyId, player }),
                );
                SocketManager.addSocket(
                    ws.data.lobbyId,
                    ws.data.player.token,
                    ws,
                );
                if (lobby.isBothPlayersOnline() || lobby.isGameReallyStarted())
                    this._startGame(lobby!);
            } else {
                console.log("Joining the lobby failed: ", lobbyId, player);
            }
        } catch (e: unknown) {
            ws.send(
                WsCommand.error({
                    message:
                        e instanceof Error
                            ? e.message
                            : "An unexpected error occured while opening the websocket connection.",
                }),
            );
        }
    }

    /**
     * Leave the lobby and send disconnected command to the client.
     */
    private _leaveLobby(ws: RWebSocket): void {
        try {
            this._checkServer();
            this._checkSocket(ws);

            const player = ws.data.player;
            const lobby = LobbyManager.getLobby(ws.data.lobbyId);
            if (!lobby) return;

            const color = lobby.getTokenColor(player.token) as Color;
            ws.unsubscribe(lobby.id);
            SocketManager.removeSocket(lobby.id, player.token);
            if (!LobbyManager.leaveLobby(lobby.id, player)) return;

            this._server!.publish(
                lobby.id,
                WsCommand.disconnected({
                    lobbyId: lobby.id,
                    color: color,
                }),
            );

            console.log("Connection closed: ", lobby.id, player.name);
            LobbyManager.deleteLobbyIfDead(lobby.id);
        } catch (e: unknown) {
            ws.send(
                WsCommand.error({
                    message:
                        e instanceof Error
                            ? e.message
                            : "An unexpected error occured while handling the websocket message.",
                }),
            );
        }
    }

    /**
     * Start the game of the given lobby id if
     * it is ready.
     */
    private _startGame(lobby: Lobby): void {
        this._checkServer();
        const isGameReadyToStart = lobby.isGameReadyToStart();
        const isGameAlreadyStarted = lobby.isGameStarted();
        if (isGameReadyToStart) {
            // Both players are online and the game is not started yet.
            console.log("Starting the game: ", lobby.id);

            // Start the game and send the started command to the clients.
            lobby.startGame();

            const whitePlayer = lobby.getWhitePlayer()!;
            const blackPlayer = lobby.getBlackPlayer()!;

            this._server!.publish(
                lobby.id,
                WsCommand.started({
                    whitePlayer: {
                        id: whitePlayer.id,
                        name: whitePlayer.name,
                        isOnline: whitePlayer.isOnline,
                    },
                    blackPlayer: {
                        id: blackPlayer.id,
                        name: blackPlayer.name,
                        isOnline: blackPlayer.isOnline,
                    },
                    game: lobby.getGameAsJsonNotation(),
                } as WsStartedData),
            );

            this._monitorGameTimeExpiration(lobby);
        } else if (isGameAlreadyStarted) {
            // One of the players is should be reconnected to the game.
            // send current board and durations to the reconnected player.
            console.log("Reconnecting player to the game: ", lobby.id);

            // Send the current game to the reconnected
            //yplayer.
            const reconnectedPlayer = lobby.getLastConnectedPlayer();
            if (!reconnectedPlayer) return;

            const reconnectedPlayerWs = SocketManager.getSocket(
                lobby.id,
                reconnectedPlayer.token,
            )!;
            if (!reconnectedPlayerWs) return;

            const whitePlayer = lobby.getWhitePlayer()!;
            const blackPlayer = lobby.getBlackPlayer()!;

            reconnectedPlayerWs.send(
                WsCommand.started({
                    whitePlayer: {
                        id: whitePlayer.id,
                        name: whitePlayer.name,
                        isOnline: whitePlayer.isOnline,
                    },
                    blackPlayer: {
                        id: blackPlayer.id,
                        name: blackPlayer.name,
                        isOnline: blackPlayer.isOnline,
                    },
                    game: lobby.getGameAsJsonNotation(),
                } as WsStartedData),
            );

            if (lobby.isGameFinished()) {
                reconnectedPlayerWs.send(
                    WsCommand.finished({
                        gameStatus: lobby.getGameStatus(),
                    }),
                );
            }

            // Send reconnected player's color to the
            // opponent player.
            const reconnectedPlayerColor =
                lobby.getLastConnectedPlayerColor() as Color;
            const opponentPlayer =
                reconnectedPlayerColor === Color.White
                    ? lobby.getBlackPlayer()
                    : lobby.getWhitePlayer();
            if (!opponentPlayer) return;

            const opponentPlayerWs = SocketManager.getSocket(
                lobby.id,
                opponentPlayer.token,
            )!;
            if (!opponentPlayerWs) return;

            opponentPlayerWs.send(
                WsCommand.reconnected({
                    lobbyId: lobby.id,
                    color: reconnectedPlayerColor,
                }),
            );
        }
    }

    /**
     * Monitor and check if the game is finished because
     * one of the players' time has expired.
     */
    private _monitorGameTimeExpiration(lobby: Lobby): void {
        const interval = setInterval(() => {
            if (lobby.isGameFinished()) {
                this._finishGame(lobby);
            }
        }, 1000);

        lobby.setGameTimeMonitorInterval(interval as unknown as number);
    }

    /**
     * Handle the messages from the client.
     */
    private _handleCommand(ws: RWebSocket, message: string): void {
        try {
            this._checkSocket(ws);

            const [command, data] = WsCommand.parse(message);
            if (!command) return;

            const lobby = LobbyManager.getLobby(ws.data.lobbyId);
            const player = ws.data.player;
            if (
                !lobby ||
                !lobby.canPlayerParticipate(
                    player,
                    ![
                        WsTitle.PlayAgainOffered,
                        WsTitle.PlayAgainAccepted,
                        WsTitle.OfferCancelled,
                        WsTitle.SentOfferCancelled,
                        WsTitle.SentOfferDeclined,
                    ].includes(command),
                )
            )
                return;

            switch (command) {
                case WsTitle.Moved:
                    this._movePiece(
                        lobby,
                        player,
                        (data as WsMovedData).from,
                        (data as WsMovedData).to,
                    );
                    break;
                case WsTitle.Resigned:
                    this._resign(lobby, player);
                    break;
                case WsTitle.DrawOffered:
                    this._offerDraw(lobby, player);
                    break;
                case WsTitle.DrawAccepted:
                    this._draw(lobby);
                    break;
                case WsTitle.UndoOffered:
                    this._offerUndo(lobby, player);
                    break;
                case WsTitle.UndoAccepted:
                    this._undo(lobby);
                    break;
                case WsTitle.Aborted:
                    this._abort(lobby);
                    break;
                case WsTitle.PlayAgainOffered:
                    this._offerPlayAgain(lobby, player);
                    break;
                case WsTitle.PlayAgainAccepted:
                    this._playAgain(lobby);
                    break;
                case WsTitle.OfferCancelled:
                    this._cancelOffer(lobby, player);
                    break;
                case WsTitle.SentOfferDeclined:
                    this._declineSentOffer(lobby, player);
                    break;
            }
        } catch (e: unknown) {
            ws.send(
                WsCommand.error({
                    message:
                        e instanceof Error
                            ? e.message
                            : "An unexpected error occured while handling the websocket message.",
                }),
            );
        }
    }

    /**
     * Move the piece on the board as the player wants
     * then send to the other player.
     */
    private _movePiece(
        lobby: Lobby,
        player: Player,
        from: Square,
        to: Square,
    ): void {
        if (lobby.canPlayerMakeMove(player)) {
            lobby.makeMove(from, to);

            const playerColor = lobby.getTokenColor(player.token) as Color;
            const opponentPlayer =
                playerColor === Color.White
                    ? lobby.getBlackPlayer()
                    : lobby.getWhitePlayer();
            if (!opponentPlayer) return;

            const opponentPlayerWs = SocketManager.getSocket(
                lobby.id,
                opponentPlayer.token,
            )!;
            if (!opponentPlayerWs) return;

            opponentPlayerWs.send(WsCommand.moved({ from, to }));
            if (lobby.isGameFinished()) this._finishGame(lobby);
        }
    }

    /**
     * Offer play again to the opponent player.
     */
    private _offerPlayAgain(lobby: Lobby, player: Player): void {
        this._offer(lobby, player, WsCommand.playAgainOffered);
    }

    /**
     * Offer draw to the opponent player.
     */
    private _offerDraw(lobby: Lobby, player: Player): void {
        this._offer(lobby, player, WsCommand.drawOffered);
    }

    /**
     * Offer undo to the opponent player.
     */
    private _offerUndo(lobby: Lobby, player: Player): void {
        this._offer(lobby, player, WsCommand.undoOffered);
        lobby.setCurrentUndoOffer(lobby.getTokenColor(player.token) as Color);
    }

    /**
     * Cancel the offer and send the offer cancelled command to the client.
     */
    private _cancelOffer(lobby: Lobby, player: Player): void {
        this._offer(lobby, player, WsCommand.sentOfferCancelled);
        lobby.disableOfferCooldown();
    }

    /**
     * Decline the sent offer and send the declined command to the client.
     */
    private _declineSentOffer(lobby: Lobby, player: Player): void {
        this._offer(lobby, player, WsCommand.sentOfferDeclined);
        lobby.disableOfferCooldown();
    }

    /**
     * Offer to the opponent player.
     * @param {WsCommand.public} offer WsCommand private _to send the offer
     * like WsCommand.playAgainOffered or WsCommand.drawOffered.
     */
    private _offer(lobby: Lobby, player: Player, offer: () => string): void {
        const playerColor = lobby.getTokenColor(player.token) as Color;
        const opponentPlayer =
            playerColor === Color.White
                ? lobby.getBlackPlayer()
                : lobby.getWhitePlayer();
        if (!opponentPlayer) return;

        const opponentPlayerWs = SocketManager.getSocket(
            lobby.id,
            opponentPlayer.token,
        )!;
        if (!opponentPlayerWs) return;

        opponentPlayerWs.send(offer());
        lobby.enableOfferCooldown();
    }

    /**
     * Accept the play again offer and send the started command to the client.
     */
    private _playAgain(lobby: Lobby): void {
        this._startGame(lobby);
    }

    /**
     * Resign the game and send the resigned command to
     * the client.
     */
    private _resign(lobby: Lobby, player: Player): void {
        this._checkServer();
        lobby.clearGameTimeMonitorInterval();
        lobby.resign(player);
        this._server!.publish(
            lobby.id,
            WsCommand.resigned({
                gameStatus: lobby.getGameStatus(),
            }),
        );
        lobby.finishGame();
    }

    /**
     * Abort the game and send the aborted command to
     * the client.
     */
    private _abort(lobby: Lobby): void {
        this._checkServer();
        lobby.clearGameTimeMonitorInterval();
        lobby.draw();
        this._server!.publish(lobby.id, WsCommand.aborted());
        lobby.finishGame();
    }

    /**
     * Accept and handle the draw offer and send the
     * finished command to the client.
     */
    private _draw(lobby: Lobby): void {
        this._checkServer();
        lobby.clearGameTimeMonitorInterval();
        lobby.draw();
        this._server!.publish(lobby.id, WsCommand.drawAccepted());
        lobby.finishGame();
    }

    /**
     * Accept and handle the undo offer and send the
     * undo accepted command to the client.
     */
    private _undo(lobby: Lobby): void {
        this._checkServer();
        lobby.undo();
        this._server!.publish(
            lobby.id,
            WsCommand.undoAccepted({
                board: lobby.getGameAsFenNotation(),
                undoColor: lobby.getCurrentUndoOffer() as Color,
            }),
        );
    }

    /**
     * Finish the game and send the finished command
     * to the client.
     */
    private _finishGame(lobby: Lobby): void {
        this._checkServer();
        lobby.clearGameTimeMonitorInterval();
        this._server!.publish(
            lobby.id,
            WsCommand.finished({
                gameStatus: lobby.getGameStatus(),
            }),
        );
        lobby.finishGame();
    }
}
