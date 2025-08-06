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
import { Player } from "src/Player";
import { DESTROY_INACTIVE_LOBBY_TIMEOUT } from "@Consts";
import { Logger } from "src/Services/Logger";

const lobbyLogger = new Logger("LobbyLogger");

/**
 * This class represents the lobby of the game.
 */
export class Lobby {
    public readonly id: string;
    public readonly createdAt: number = Date.now();
    private _lastPlayedAt: number = Date.now();
    private _restartCount = 0;

    private whitePlayer: Player | null = null;
    private blackPlayer: Player | null = null;

    private gameTimeMonitorInterval: number | null = null;
    private _activeOfferPlayerColor: Color | null = null;
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
        initialDuration: Duration,
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
    public get lastPlayedAt(): number {
        return this._lastPlayedAt;
    }

    /**
     * Update the last updated time of the lobby.
     */
    private updateLastPlayedAt(): void {
        this._lastPlayedAt = Date.now();
    }

    /**
     * Get the white player of the lobby.
     */
    public getWhitePlayer(): Player | null {
        return this.whitePlayer;
    }

    /**
     * Get the black player of the lobby.
     */
    public getBlackPlayer(): Player | null {
        return this.blackPlayer;
    }

    /**
     * Get the current board as json notation.
     */
    public getGameAsJsonNotation(): JsonNotation {
        return this.isGameStarted()
            ? this.chessEngine.getGameAsJsonNotation()
            : typeof this.board === "string"
              ? Converter.fenToJson(this.board)
              : this.board;
    }

    /**
     * Get the current board as fen notation.
     */
    public getGameAsFenNotation(): string {
        return this.isGameStarted()
            ? this.chessEngine.getGameAsFenNotation()
            : typeof this.board === "string"
              ? this.board
              : Converter.jsonToFen(this.board);
    }

    /**
     * Check if both players are online.
     */
    public areBothPlayersOnline(): boolean {
        return (
            !!this.whitePlayer &&
            this.whitePlayer.isOnline &&
            !!this.blackPlayer &&
            this.blackPlayer.isOnline
        );
    }

    /**
     * Check if both players are offline.
     */
    public areBothPlayersOffline(): boolean {
        const whitePlayer = this.getWhitePlayer();
        if (whitePlayer !== null && whitePlayer.isOnline) return false;

        const blackPlayer = this.getBlackPlayer();
        if (blackPlayer !== null && blackPlayer.isOnline) return false;

        return true;
    }

    /**
     * Is given player in the lobby.
     */
    public isPlayerInLobby(player: Player): boolean {
        return (
            this.whitePlayer?.token === player.token ||
            this.blackPlayer?.token === player.token
        );
    }

    /**
     * Get the color of the player.
     */
    public getColorOfPlayer(player: Player): Color | null {
        return this.whitePlayer?.token === player.token
            ? Color.White
            : this.blackPlayer?.token === player.token
              ? Color.Black
              : null;
    }

    /**
     * Add the player to the lobby.
     */
    public addPlayer(player: Player): boolean {
        if (this.isPlayerInLobby(player)) {
            // Reconnect the player
            if (!player.isOnline) this.setPlayerOnline(player);
            lobbyLogger.save("Player is already in the lobby: ", player.id, player.name);
            return true;
        }

        lobbyLogger.save("Player is not in the lobby: ", player.id, player.name);

        if (this.whitePlayer) {
            if (this.blackPlayer) {
                lobbyLogger.save("Lobby is full");
                return false;
            }
            this.setBlackPlayer(player);
        } else if (this.blackPlayer) {
            this.setWhitePlayer(player);
        } else {
            const randomColor = Math.random() > 0.5 ? Color.White : Color.Black;
            if (randomColor == Color.White) {
                this.setWhitePlayer(player);
            } else if (randomColor == Color.Black) {
                this.setBlackPlayer(player);
            }
        }

        if (!player.isOnline) {
            this.setPlayerOnline(player);
        }

        return true;
    }

    /**
     * Set the white player of the lobby.
     */
    private setWhitePlayer(player: Player): void {
        this.whitePlayer = player;
    }

    /**
     * Set the black player of the lobby.
     */
    private setBlackPlayer(player: Player): void {
        this.blackPlayer = player;
    }

    /**
     * Flip the colors of the players.
     */
    private flipColors(): void {
        if (this.whitePlayer && this.blackPlayer) {
            const temp = { ...this.whitePlayer };
            this.setWhitePlayer(this.blackPlayer!);
            this.setBlackPlayer(temp);
        }
    }

    /**
     * Set the player as online in the lobby.
     */
    public setPlayerOnline(player: Player): void {
        if (this.isPlayerInLobby(player)) {
            player.isOnline = true;
        }
    }

    /**
     * Set the player as offline in the lobby.
     */
    public setPlayerOffline(player: Player): void {
        if (this.isPlayerInLobby(player)) {
            player.isOnline = false;
        }
    }

    /**
     * Set the game time monitor interval id for
     * clearing the interval when the game is finished.
     */
    public setGameTimeMonitorInterval(callback: () => void): void {
        this.gameTimeMonitorInterval = setInterval(() => {
            callback();
        }, 1000) as unknown as number;
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
        return (
            !!this.board &&
            !!this.durations &&
            !this.isGameStarted() &&
            this.areBothPlayersOnline()
        );
    }

    /**
     * Check if the game is started. The game becomes started
     * when both players are online and engine is created.
     */
    public isGameStarted(): boolean {
        return this._isGameStarted;
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
     * Set active offer.
     */
    public setActiveOffer(player: Player): void {
        this._activeOfferPlayerColor = this.getColorOfPlayer(player);
    }

    /**
     * Get active offer.
     */
    public getActiveOffer(): Color | null {
        return this._activeOfferPlayerColor;
    }

    /**
     * Remove active offer.
     */
    public removeActiveOffer(): boolean {
        if (!this.getActiveOffer()) return false;
        this._activeOfferPlayerColor = null;
        return true;
    }

    /**
     * Finish the game as draw. This method should be used when
     * both players agree to finish the game as draw.
     */
    public abort(): boolean {
        if (this.isGameStarted() && this.chessEngine.getMoveHistory().length > 0 || this.isGameFinished()) return false;
        this.chessEngine.setGameStatus(GameStatus.ReadyToStart);
        return this.finishGame();
    }

    /**
     * Resign a player from the game.
     */
    public resign(player: Player): boolean {
        if (!this.isGameStarted() || this.isGameFinished()) return false;
        const color = this.getColorOfPlayer(player);
        if (!color) return false;

        this.chessEngine.setGameStatus(
            color == Color.White
                ? GameStatus.BlackVictory
                : GameStatus.WhiteVictory,
        );
        return this.finishGame();
    }

    /**
     * Finish the game as draw. This method should be used when
     * both players agree to finish the game as draw.
     */
    public draw(): boolean {
        if (!this.getActiveOffer() || !this.isGameStarted() || this.isGameFinished()) return false;
        this.chessEngine.setGameStatus(GameStatus.Draw);
        return this.finishGame();
    }

    /**
     * Take back the last move. This method should be used when
     * both players agree to take back the last move.
     */
    public undo(): Color | false {
        if (!this.isGameStarted() || this.isGameFinished()) return false;
        const undoColor = this.getActiveOffer();
        if (!undoColor) return false;
        this.chessEngine.takeBack(undoColor);
        this.removeActiveOffer();
        this.updateLastPlayedAt();
        return undoColor;
    }

    /**
     * Make a move on the board.
     */
    public makeMove(player: Player, from: Square, to: Square): boolean {
        if (!this.isPlayerInLobby(player)) return false;
        if (!this.isGameStarted() || this.isGameFinished()) return false;
        if (this.chessEngine.getTurnColor() !== this.getColorOfPlayer(player)) return false;
        this.chessEngine.playMove(from, to);
        this.updateLastPlayedAt();
        return true;
    }

    /**
     * Start the game.
     */
    public startGame(): void {
        if (!this.isGameReadyToStart()) {
            lobbyLogger.save("Game is not ready to start.");
            return;
        }
        if (this._restartCount >= 1) this.flipColors();
        this.chessEngine.createGame({
            ...(typeof this.board === "string"
                ? Converter.fenToJson(this.board)
                : this.board),
            durations: JSON.parse(JSON.stringify(this.durations)),
        });
        this._isGameStarted = true;
        this._restartCount += 1;
        this.updateLastPlayedAt();
        this.removeActiveOffer();
    }

    /**
     * Finish the game.
     */
    public finishGame(): boolean {
        this._isGameStarted = false;
        this.clearGameTimeMonitorInterval();
        this.removeActiveOffer();
        this.updateLastPlayedAt();
        return true;
    }

    /**
     * Check if the lobby is inactive and safe to clean up.
     */
    public isReadyForCleanup(): boolean {
        if (this.lastPlayedAt + DESTROY_INACTIVE_LOBBY_TIMEOUT < Date.now())
            return true;

        return (
            this.areBothPlayersOffline() &&
            (this.isGameFinished() ||
                !this.isGameStarted() ||
                this.chessEngine.getMoveHistory().length < 2)
        );
    }
}
