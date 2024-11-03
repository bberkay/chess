import type { Player } from "../Types";
import {
    Color,
    Duration,
    Durations,
    GameStatus,
    JsonNotation,
    Square,
    StartPosition,
} from "@Chess/Types";
import { ChessEngine } from "@Chess/Engine/ChessEngine";
import { Converter } from "@Chess/Utils/Converter";
import { GU_ID_LENGTH } from "src/Consts";
import { createRandomId, deepFreeze } from "./Helper";

/**
 * This class represents the lobby of the game.
 */
export class Lobby {
    public readonly id: string;
    public readonly createdAt: number = Date.now();
    private _updatedAt: number = Date.now();

    private whitePlayer: Player | null = null;
    private blackPlayer: Player | null = null;
    private lastConnectedPlayerColor: Color | null = null;
    private gameTimeMonitorInterval: number | null = null;
    private isThereAnyOffer: boolean = false;
    private currentUndoOffer: Color | null = null;
    private _isGameStarted: boolean = false;

    private readonly chessEngine: ChessEngine = new ChessEngine();

    // Inital values
    private readonly board: StartPosition | JsonNotation | string;
    private readonly durations: Durations;

    /**
     * Constructor of the Lobby class.
     */
    public constructor(
        id: string,
        board: StartPosition | JsonNotation | string = StartPosition.Standard,
        initialDuration: Duration
    ) {
        this.id = id;
        this.board = board;
        this.durations = {
            [Color.White]: initialDuration,
            [Color.Black]: initialDuration,
        };
    }

    /**
     * Get the last updated time of the lobby.
     */
    public get updatedAt(): number {
        return this._updatedAt;
    }

    /**
     * Update the last updated time of the lobby.
     */
    private updateUpdatedAt(): void {
        this._updatedAt = Date.now();
    }

    /**
     * Get the white player of the lobby.
     */
    public getWhitePlayer(): Readonly<Player | null> {
        if (this.whitePlayer === null) return null;
        return deepFreeze({ ...this.whitePlayer });
    }

    /**
     * Get the black player of the lobby.
     */
    public getBlackPlayer(): Readonly<Player | null> {
        if (this.blackPlayer === null) return null;
        return deepFreeze({ ...this.blackPlayer });
    }

    /**
     * Get the player name by color.
     */
    private getPlayerNameByColor(color: Color): string | null {
        return color === Color.White && this.whitePlayer !== null
            ? this.whitePlayer.name
            : color === Color.Black && this.blackPlayer !== null
            ? this.blackPlayer.name
            : null;
    }

    /**
     * Get the player id by color.
     */
    private getPlayerIdByColor(color: Color): string | null {
        return color === Color.White && this.whitePlayer !== null
            ? this.whitePlayer.id
            : color === Color.Black && this.blackPlayer !== null
            ? this.blackPlayer.id
            : null;
    }

    /**
     * Get the current board as json notation.
     */
    public getGameAsJsonNotation(): JsonNotation {
        return this.isGameStarted() 
            ? this.chessEngine.getGameAsJsonNotation() 
            : typeof this.getInitialBoard() === "string" 
                ? Converter.fenToJson(this.getInitialBoard() as string)
                : this.getInitialBoard() as JsonNotation;
    }

    /**
     * Get the current board as fen notation.
     */
    public getGameAsFenNotation(): string {
        return this.isGameStarted() 
            ? this.chessEngine.getGameAsFenNotation() 
            : typeof this.getInitialBoard() === "string"
                ? this.getInitialBoard() as string
                : Converter.jsonToFen(this.getInitialBoard() as JsonNotation);
    }

    /**
     * Get the initial durations of the game.
     */
    public getInitialDurations(): Readonly<Durations> {
        return this.durations;
    }

    /**
     * Get the initial board of the game.
     */
    public getInitialBoard(): StartPosition | JsonNotation | string {
        return this.board;
    }

    /**
     * Check if both players are online.
     */
    public isBothPlayersOnline(): boolean {
        const whitePlayer = this.getWhitePlayer();
        if (whitePlayer === null || !whitePlayer.isOnline) return false;

        const blackPlayer = this.getBlackPlayer();
        if (blackPlayer === null || !blackPlayer.isOnline) return false;

        return true;
    }

    /**
     * Check if both players are offline.
     */
    public isBothPlayersOffline(): boolean {
        const whitePlayer = this.getWhitePlayer();
        if (whitePlayer === null || whitePlayer.isOnline) return false;

        const blackPlayer = this.getBlackPlayer();
        if (blackPlayer === null || blackPlayer.isOnline) return false;

        return true;
    }

    /**
     * Is given player in the lobby.
     */
    public isPlayerInLobby(player: Player): boolean {
        const whitePlayer = this.getWhitePlayer();
        if (
            whitePlayer &&
            whitePlayer.name === player.name &&
            whitePlayer.token === player.token
        )
            return true;

        const blackPlayer = this.getBlackPlayer();
        if (
            blackPlayer &&
            blackPlayer.name === player.name &&
            blackPlayer.token === player.token
        )
            return true;

        return false;
    }

    /**
     * Is there a player in the lobby that has the given user token?
     */
    public isTokenInLobby(token: string): boolean {
        const whitePlayer = this.getWhitePlayer();
        if (whitePlayer && whitePlayer.token === token) return true;

        const blackPlayer = this.getBlackPlayer();
        if (blackPlayer && blackPlayer.token === token) return true;

        return false;
    }

    /**
     * Is there a online player that has the given user token?
     */
    public isTokenOnline(token: string): boolean {
        const whitePlayer = this.getWhitePlayer();
        if (whitePlayer && whitePlayer.token === token)
            return whitePlayer.isOnline;

        const blackPlayer = this.getBlackPlayer();
        if (blackPlayer && blackPlayer.token === token)
            return blackPlayer.isOnline;

        return false;
    }

    /**
     * Get the color of the player that has the given user token(if exists).
     */
    public getTokenColor(token: string): Color | null {
        const whitePlayer = this.getWhitePlayer();
        if (whitePlayer !== null && whitePlayer.token === token)
            return Color.White;

        const blackPlayer = this.getBlackPlayer();
        if (blackPlayer !== null && blackPlayer.token === token)
            return Color.Black;

        return null;
    }

    /**
     * Get the name of the player that has the given user token(if exists).
     */
    public getTokenName(token: string): string | null {
        const color = this.getTokenColor(token);
        return color !== null ? this.getPlayerNameByColor(color) : null;
    }

    /**
     * Get the id of the player that has the given user token(if exists).
     */
    public getTokenId(token: string): string | null {
        const color = this.getTokenColor(token);
        return color !== null ? this.getPlayerIdByColor(color) : null;
    }

    /**
     * Get the last connected player if there is any.
     */
    public getLastConnectedPlayer(): Player | null {
        return this.lastConnectedPlayerColor === Color.White
            ? this.getWhitePlayer()
            : this.lastConnectedPlayerColor === Color.Black
            ? this.getBlackPlayer()
            : null;
    }

    /**
     * Get the last connected player color if there is any.
     */
    public getLastConnectedPlayerColor(): Color | null {
        return this.lastConnectedPlayerColor;
    }

    /**
     * Add the player to the lobby.
     */
    public addPlayer(player: Player): boolean {
        if (this.isTokenInLobby(player.token)) {
            console.log("Player is already in the lobby: ", player);
            // Reconnect the player with the same color
            if (this.isTokenOnline(player.token)) {
                console.log(
                    "Player is already online: ",
                    player.token,
                    player.name,
                    player.isOnline
                );
                return false;
            }

            const color = this.getTokenColor(player.token) as Color;
            if (color === Color.White) this.setWhitePlayer(player);
            else if (color === Color.Black) this.setBlackPlayer(player);

            this.setPlayerOnline(player);
        } else {
            console.log("Player is not in the lobby: ", player);
            // Add the player to the lobby with the random color
            // if there is no player unless add with available color.
            const whitePlayer = this.getWhitePlayer();
            const blackPlayer = this.getBlackPlayer();
            if (whitePlayer && blackPlayer) {
                console.log("Lobby is full.");
                return false;
            }

            if (whitePlayer) {
                this.setBlackPlayer(player);
            } else if (blackPlayer) {
                this.setWhitePlayer(player);
            } else {
                const randomColor =
                    Math.random() > 0.5 ? Color.White : Color.Black;
                if (randomColor == Color.White) this.setWhitePlayer(player);
                else if (randomColor == Color.Black)
                    this.setBlackPlayer(player);
            }

            this.setPlayerOnline(player);
        }

        return true;
    }

    /**
     * Set the white player of the lobby.
     */
    private setWhitePlayer(player: Player): void {
        if (!player.id)
            player.id = createRandomId(
                GU_ID_LENGTH,
                this.getPlayerIdByColor(Color.Black)
            );

        this.whitePlayer = player;
    }

    /**
     * Set the black player of the lobby.
     */
    private setBlackPlayer(player: Player): void {
        if (!player.id)
            player.id = createRandomId(
                GU_ID_LENGTH,
                this.getPlayerIdByColor(Color.White)
            );

        this.blackPlayer = player;
    }

    /**
     * Flip the colors of the players.
     */
    private flipColors(): void {
        if (this.getWhitePlayer() && this.getBlackPlayer()) {
            const temp = { ...this.whitePlayer };
            this.setWhitePlayer(this.blackPlayer!);
            this.setBlackPlayer(temp as Player);
        }
    }

    /**
     * Set the player as online in the lobby.
     */
    public setPlayerOnline(player: Player): void {
        if (this.isPlayerInLobby(player)) {
            const tokenColor = this.getTokenColor(player.token);
            const tokenPlayer =
                tokenColor === Color.White
                    ? this.whitePlayer!
                    : this.blackPlayer!;
            tokenPlayer.isOnline = true;
            this.lastConnectedPlayerColor = tokenColor;
        }
    }

    /**
     * Set the player as offline in the lobby.
     */
    public setPlayerOffline(player: Player): void {
        if (this.isPlayerInLobby(player)) {
            const tokenPlayer =
                this.getTokenColor(player.token) === Color.White
                    ? this.whitePlayer!
                    : this.blackPlayer!;
            tokenPlayer.isOnline = false;
            console.log("Player is offline: ", player.token, player.name);
        }
    }

    /**
     * Set the game time monitor interval id for
     * clearing the interval when the game is finished.
     */
    public setGameTimeMonitorInterval(interval: number): void {
        this.gameTimeMonitorInterval = interval;
    }

    /**
     * Clear the game time monitor interval.
     */
    public clearGameTimeMonitorInterval(): void {
        if (this.gameTimeMonitorInterval !== null)
            clearInterval(this.gameTimeMonitorInterval);

        this.gameTimeMonitorInterval = null;
    }

    /**
     * Check if the game is ready to start.
     */
    public isGameReadyToStart(): boolean {
        if (!this.board) return false;

        if (
            this.durations[Color.White].remaining <= 0 ||
            this.durations[Color.White].increment < 0 ||
            this.durations[Color.Black].remaining <= 0 ||
            this.durations[Color.Black].increment < 0
        )
            return false;

        if (this.isGameStarted()) return false;

        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        if (whitePlayer === null || blackPlayer === null) return false;
        if (!whitePlayer.isOnline || !blackPlayer.isOnline) return false;

        return true;
    }

    /**
     * Check if the game is started. The game becomes started
     * when both players are online and engine is created.
     */
    public isGameStarted(): boolean {
        return this._isGameStarted;
    }

    /**
     * Check if the game is really started. The game becomes really
     * started when both players make their first moves.
     */
    public isGameReallyStarted(): boolean {
        return this.isGameStarted() && this.chessEngine.getMoveHistory().length > 1;
    }

    /**
     * Check if the game is finished.
     */
    public isGameFinished(): boolean {
        return [
            GameStatus.BlackVictory,
            GameStatus.WhiteVictory,
            GameStatus.Draw,
        ].includes(this.chessEngine.getGameStatus());
    }

    /**
     * Get the game status.
     */
    public getGameStatus(): GameStatus {
        return this.chessEngine.getGameStatus();
    }

    /**
     * Check if the player can make a move.
     */
    public canPlayerMakeMove(player: Player): boolean {
        this.canPlayerParticipate(player);
        return (
            this.chessEngine.getTurnColor() == this.getTokenColor(player.token)
        );
    }

    /**
     * Check if the player can participate in the game.
     */
    public canPlayerParticipate(
        player: Player,
        isGameShouldBeInPlay: boolean = true
    ): boolean {
        if (isGameShouldBeInPlay && !this.isGameStarted()) return false;
        if (isGameShouldBeInPlay && this.isGameFinished()) return false;
        if (!this.isPlayerInLobby(player)) return false;
        if (!this.getTokenColor(player.token)) return false;
        return true;
    }

    /**
     * Check if there is any offer in the lobby.
     */
    public isOffersOnCooldown(): boolean {
        return this.isThereAnyOffer;
    }

    /**
     * Set current undo offer color of the lobby.
     */
    public setCurrentUndoOffer(color: Color): void {
        this.currentUndoOffer = color;
    }

    /**
     * Get the current undo offer color of the lobby.
     */
    public getCurrentUndoOffer(): Color | null {
        return this.currentUndoOffer;
    }

    /**
     * Enable the offer cooldown to prevent the
     * players to offer something again.
     */
    public enableOfferCooldown(): void {
        this.isThereAnyOffer = true;
    }

    /**
     * Disable the offer cooldown to allow the
     * players to offer something.
     */
    public disableOfferCooldown(): void {
        this.isThereAnyOffer = false;
        this.currentUndoOffer = null;
    }

    /**
     * Resign a player from the game.
     */
    public resign(player: Player): void {
        const color = this.getTokenColor(player.token);
        if (!color) return;

        this.chessEngine.setGameStatus(
            color == Color.White
                ? GameStatus.BlackVictory
                : GameStatus.WhiteVictory
        );
        this.updateUpdatedAt();
    }

    /**
     * Finish the game as draw. This method should be used when
     * both players agree to finish the game as draw.
     */
    public draw(): void {
        this.chessEngine.setGameStatus(GameStatus.Draw);
        this.updateUpdatedAt();
    }

    /**
     * Take back the last move. This method should be used when
     * both players agree to take back the last move.
     */
    public undo(): void {
        this.chessEngine.takeBack(this.currentUndoOffer);
        this.updateUpdatedAt();
    }

    /**
     * Make a move on the board.
     */
    public makeMove(from: Square, to: Square): void {
        if (!this.isGameStarted()) return;
        this.chessEngine.playMove(from, to);
        this.updateUpdatedAt();
    }

    /**
     * Start the game.
     */
    public startGame(): void {
        if (!this.isGameReadyToStart()) return;
        this.disableOfferCooldown();
        this.flipColors();
        this.chessEngine.createGame({
            ...(typeof this.board === "string"
                ? Converter.fenToJson(this.board)
                : this.board),
            durations: JSON.parse(JSON.stringify(this.getInitialDurations())),
        });
        this._isGameStarted = true;
        this.updateUpdatedAt();
    }

    /**
     * Finish the game.
     */
    public finishGame(): void {
        this._isGameStarted = false;
        this.clearGameTimeMonitorInterval();
        this.disableOfferCooldown();
        this.updateUpdatedAt();
    }
}
