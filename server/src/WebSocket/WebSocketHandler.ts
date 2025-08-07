import type { Server } from "bun";
import {
    WsCommand,
    WsTitle,
    type RWebSocket,
    type WebSocketData,
} from ".";
import { Player, PlayerRegistry } from "@Player";
import { HTTPGetRoutes, CORSResponse } from "@HTTP";
import { LobbyRegistry } from "@Lobby";
import { Lobby } from "@Lobby";
import { Color, Square } from "@Chess/Types";
import { WebSocketValidator } from "./WebSocketValidator";
import { WebSocketValidatorError } from ".";

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
 * const handler = new WebSocketHandler();
 * const server = Bun.serve({
 *   websocket: {
 *     ...handler.expose(),
 *   },
 * });
 * handler.upgradeServer(server);
 * ```
 */
export class WebSocketHandler {
    private _server: Server | null;

    constructor() {
        this._server = null;
    }

    /**
     * Parses and validates the incoming WebSocket upgrade request,
     * extracting and verifying the lobby ID and player token.
     */
    public createWsData(
        req: Request,
    ): WebSocketData | CORSResponse<HTTPGetRoutes.Root> {
        try {
            const { lobbyId, playerToken } = WebSocketValidator.parseAndValidate(req);

            const lobby = LobbyRegistry.get(lobbyId);
            if (!lobby) {
                return new CORSResponse(
                    {
                        success: false,
                        message: `Lobby not found.`,
                    },
                    { status: 404 },
                );
            }

            const player = PlayerRegistry.get(playerToken);
            if (!player) {
                return new CORSResponse(
                    {
                        success: false,
                        message: `Invalid playerToken.`,
                    },
                    { status: 401 },
                );
            }

            return { lobby, player };
        } catch (e: unknown) {
            return new CORSResponse(
                {
                    success: false,
                    message:
                        e instanceof WebSocketValidatorError
                            ? e.message
                            : "An error occurred while handling the ws url.",
                },
                {
                    status:
                        e instanceof WebSocketValidatorError ? 400 : 500,
                },
            );
        }
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
     * Checks if the request is a WebSocket upgrade request.
     */
    public canHandle(req: Request): boolean {
        return req.headers.get("upgrade") === "websocket";
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
     * Join the lobby and start the game if the lobby is ready.
     * Send connected command to the client.
     */
    private _joinLobby(ws: RWebSocket): void {
        try {
            const lobby = ws.data.lobby;
            const player = ws.data.player;
            console.log("Connection opened: ", lobby.id, player.token, player.name);

            LobbyRegistry.join(lobby.id, player);

            if (!lobby.isPlayerInLobby(player)) {
                ws.send(
                    WsCommand.create([
                        WsTitle.Error,
                        { message: "User is not a player of lobby." },
                    ]),
                );
                return;
            }

            const color = lobby.getColorOfPlayer(player);
            if (!color) {
                ws.send(
                    WsCommand.create([
                        WsTitle.Error,
                        { message: "Color of player could not found." },
                    ]),
                );
                return;
            }

            ws.subscribe(lobby.id);
            ws.send(
                WsCommand.create([WsTitle.Connected, { playerId: player.id }]),
            );

            if (lobby.areBothPlayersOnline()) {
                console.log("Game should start now: ", lobby.id);
                this._startGame(ws, lobby);
            }
        } catch (e: unknown) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message:
                            e instanceof Error
                                ? e.message
                                : "An unexpected error occured while opening the websocket connection.",
                    },
                ]),
            );
        }
    }

    /**
     * Leave the lobby and send disconnected command to the client.
     */
    private _leaveLobby(ws: RWebSocket): void {
        try {
            const lobby = ws.data.lobby;
            const player = ws.data.player;

            const color = lobby.getColorOfPlayer(player)!;

            LobbyRegistry.leave(lobby.id, player)

            ws.publish(
                lobby.id,
                WsCommand.create([WsTitle.Disconnected, { color }]),
            );
            ws.unsubscribe(lobby.id);

            console.log("Connection closed: ", lobby.id, player.name);
            LobbyRegistry.destroy(lobby.id);
        } catch (e: unknown) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message:
                            e instanceof Error
                                ? e.message
                                : "An unexpected error occured while handling the websocket message.",
                    },
                ]),
            );
        }
    }

    /**
     * Start the game of the given lobby id if
     * it is ready.
     */
    private _startGame(ws: RWebSocket, lobby: Lobby): void {
        const createStartedCommand = () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { token: tokenW, ...whitePlayer } = lobby.getWhitePlayer()!;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { token: tokenB, ...blackPlayer } = lobby.getBlackPlayer()!;

            return WsCommand.create([
                WsTitle.Started,
                {
                    game: lobby.getGameAsJsonNotation(),
                    players: {
                        [Color.White]: whitePlayer,
                        [Color.Black]: blackPlayer,
                    },
                },
            ]);
        };

        if (lobby.isGameReadyToStart()) {
            console.log("Starting the game: ", lobby.id);

            // Start the game and send the started command to the clients.
            lobby.startGame();
            this._server!.publish(lobby.id, createStartedCommand());
            this._monitorGameTimeExpiration(ws, lobby);
        } else if (lobby.isGameStarted()) {
            // Game is already started so it means that one of the
            // players is reconnected.
            console.log("Reconnecting player to the game: ", lobby.id);

            ws.send(createStartedCommand());

            const color = lobby.getColorOfPlayer(ws.data.player)!;
            ws.publish(
                lobby.id,
                WsCommand.create([WsTitle.Reconnected, { color }]),
            );

            if (lobby.isGameFinished()) {
                ws.send(
                    WsCommand.create([
                        WsTitle.Finished,
                        {
                            gameStatus: lobby.getGameStatus(),
                        },
                    ]),
                );
            }
        }
    }

    /**
     * Monitor and check if the game is finished because
     * one of the players' time has expired.
     */
    private _monitorGameTimeExpiration(ws: RWebSocket, lobby: Lobby): void {
        lobby.setGameTimeMonitorInterval(() => {
            if (lobby.isGameFinished()) {
                this._finishGame(ws, lobby);
            }
        });
    }

    /**
     * Handle the messages from the client.
     */
    private _handleCommand(ws: RWebSocket, message: string): void {
        try {
            console.log("Incoming message: ", message);
            const [command, data] = WsCommand.parse(message);
            if (!command) return;

            const lobby = ws.data.lobby;
            const player = ws.data.player;
            if (!lobby || !lobby.isPlayerInLobby(player)) {
                ws.send(
                    WsCommand.create([
                        WsTitle.Error,
                        {
                            message:
                                "Lobby could not or player not in the lobby",
                        },
                    ]),
                );
                return;
            }

            switch (command) {
                case WsTitle.Aborted:
                    this._abort(ws, lobby);
                    break;
                case WsTitle.Resigned:
                    this._resign(ws, lobby, player);
                    break;
                case WsTitle.Moved:
                    this._movePiece(ws, lobby, player, data.from, data.to);
                    break;
                case WsTitle.UndoOffered:
                    this._offerUndo(ws, lobby, player);
                    break;
                case WsTitle.UndoAccepted:
                    this._acceptUndo(ws, lobby);
                    break;
                case WsTitle.DrawOffered:
                    this._offerDraw(ws, lobby, player);
                    break;
                case WsTitle.DrawAccepted:
                    this._acceptDraw(ws, lobby);
                    break;
                case WsTitle.PlayAgainOffered:
                    this._offerPlayAgain(ws, lobby, player);
                    break;
                case WsTitle.PlayAgainAccepted:
                    this._acceptPlayAgain(ws, lobby);
                    break;
                case WsTitle.OfferCancelled:
                    this._cancelOffer(ws, lobby);
                    break;
                case WsTitle.OfferDeclined:
                    this._declineOffer(ws, lobby);
                    break;
            }
        } catch (e: unknown) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message:
                            e instanceof Error
                                ? e.message
                                : "An unexpected error occured while handling the websocket message.",
                    },
                ]),
            );
        }
    }

    /**
     * Abort the game and send the aborted command to
     * the client.
     */
    private _abort(ws: RWebSocket, lobby: Lobby): void {
        if (!lobby.abort()) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message: `Could not abort the game`,
                    },
                ]),
            );
            return;
        }
        this._server!.publish(lobby.id, WsCommand.create([WsTitle.Aborted]));
    }

    /**
     * Resign the game and send the resigned command to
     * the client.
     */
    private _resign(ws: RWebSocket, lobby: Lobby, player: Player): void {
        if (!lobby.resign(player)) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message: `Could not resign from the game`,
                    },
                ]),
            );
            return;
        }
        this._server!.publish(
            lobby.id,
            WsCommand.create([
                WsTitle.Resigned,
                {
                    gameStatus: lobby.getGameStatus(),
                },
            ]),
        );
    }

    /**
     * Move the piece on the board as the player wants
     * then send to the other player.
     */
    private _movePiece(
        ws: RWebSocket,
        lobby: Lobby,
        player: Player,
        from: Square,
        to: Square,
    ): void {
        if (!lobby.makeMove(player, from, to)) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message: `Color of player could not found. Move from ${from} to ${to} could not played.`,
                    },
                ]),
            );
            return;
        }
        ws.publish(
            lobby.id,
            WsCommand.create([WsTitle.Moved, { from, to }]),
        );
        if (lobby.isGameFinished()) this._finishGame(ws, lobby);
        else console.log("DIDNT FINISHED");
    }

    /**
     * Offer undo to the opponent player.
     */
    private _offerUndo(ws: RWebSocket, lobby: Lobby, player: Player): void {
        if (!lobby.isGameStarted() || lobby.isGameFinished()) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message: `Could not offer undo.`,
                    },
                ]),
            );
            return;
        }
        lobby.setActiveOffer(player);
        ws.publish(lobby.id, WsCommand.create([WsTitle.UndoOffered]));
    }

    /**
     * Offer draw to the opponent player.
     */
    private _offerDraw(ws: RWebSocket, lobby: Lobby, player: Player): void {
        if (!lobby.isGameStarted() || lobby.isGameFinished()) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message: `Could not offer draw.`,
                    },
                ]),
            );
            return;
        }
        lobby.setActiveOffer(player);
        ws.publish(lobby.id, WsCommand.create([WsTitle.DrawOffered]));
    }

    /**
     * Offer play again to the opponent player.
     */
    private _offerPlayAgain(ws: RWebSocket, lobby: Lobby, player: Player): void {
        if (!lobby.isGameFinished()) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message: `Could not offer play again.`,
                    },
                ]),
            );
            return;
        }
        lobby.setActiveOffer(player);
        ws.publish(lobby.id, WsCommand.create([WsTitle.PlayAgainOffered]));
    }

    /**
     * Accept the play again offer and send the started command to the client.
     */
    private _acceptPlayAgain(ws: RWebSocket, lobby: Lobby): void {
        if (!lobby.getActiveOffer()) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message: `Could not accept play again offer.`,
                    },
                ]),
            );
            return;
        }
        this._server!.publish(lobby.id, WsCommand.create([WsTitle.PlayAgainAccepted]));
        this._startGame(ws, lobby);
    }

    /**
     * Accept and handle the draw offer and send the
     * finished command to the client.
     */
    private _acceptDraw(ws: RWebSocket, lobby: Lobby): void {
        if (!lobby.draw()) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message: `Could not draw the game.`,
                    },
                ]),
            );
            return;
        }
        this._server!.publish(
            lobby.id,
            WsCommand.create([WsTitle.DrawAccepted]),
        );
    }

    /**
     * Accept and handle the undo offer and send the
     * undo accepted command to the client.
     */
    private _acceptUndo(ws: RWebSocket, lobby: Lobby): void {
        const undoColor = lobby.undo();
        if (!undoColor) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message: `Could not accept undo offer.`,
                    },
                ]),
            );
            return;
        };
        this._server!.publish(
            lobby.id,
            WsCommand.create([
                WsTitle.UndoAccepted,
                {
                    board: lobby.getGameAsFenNotation(),
                    undoColor: undoColor,
                },
            ]),
        );
    }

    /**
     * Cancel the offer and send the offer cancelled command to the client.
     */
    private _cancelOffer(ws: RWebSocket, lobby: Lobby): void {
        if (!lobby.removeActiveOffer()) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message: `Could not cancel offer.`,
                    },
                ]),
            );
            return;
        }
        ws.publish(lobby.id, WsCommand.create([WsTitle.OfferCancelled]));
    }

    /**
     * Decline the sent offer and send the declined command to the client.
     */
    private _declineOffer(ws: RWebSocket, lobby: Lobby): void {
        if (!lobby.removeActiveOffer()) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message: `Could not decline offer.`,
                    },
                ]),
            );
            return;
        }
        ws.publish(lobby.id, WsCommand.create([WsTitle.OfferDeclined]));
    }

    /**
     * Finish the game and send the finished command
     * to the client.
     */
    private _finishGame(ws: RWebSocket, lobby: Lobby): void {
        if (!lobby.finishGame()) {
            ws.send(
                WsCommand.create([
                    WsTitle.Error,
                    {
                        message: `Could not finish game.`,
                    },
                ]),
            );
            return;
        }
        this._server!.publish(
            lobby.id,
            WsCommand.create([
                WsTitle.Finished,
                {
                    gameStatus: lobby.getGameStatus(),
                },
            ]),
        );
    }
}
