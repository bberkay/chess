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
import { Player } from "@Player";
import { DESTROY_INACTIVE_LOBBY_TIMEOUT } from "@Consts";

export type OfferType = "Undo" | "Draw" | "PlayAgain"
export type Offerer = Player
export type ActiveOffer = [Offerer, OfferType];

/**
 * This class represents the lobby of the game.
 */
export class Lobby {
    public readonly id: string;
    public readonly createdAt: number = Date.now();
    private _lastPlayedAt: number = Date.now();
    private _matchCount = 1;

    private _whitePlayer: Player | null = null;
    private _blackPlayer: Player | null = null;

    private _gameTimeMonitorInterval: number | null = null;
    private _activeOffer: ActiveOffer | null = null;
    private _isGameStarted: boolean = false;

    private readonly _chessEngine: ChessEngine = new ChessEngine();

    // Inital values
    private readonly _board: StartPosition | JsonNotation | string;
    private readonly _durations: Durations;

    /**
     * Constructor of the Lobby class.
     */
    public constructor(
        id: string,
        board: StartPosition | JsonNotation | string = StartPosition.Standard,
        initialDuration: Duration,
    ) {
        this.id = id;
        this._board = board;
        this._durations = {
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
        return this._whitePlayer;
    }

    /**
     * Get the black player of the lobby.
     */
    public getBlackPlayer(): Player | null {
        return this._blackPlayer;
    }

    /**
     * Get the current board as json notation.
     */
    public getGameAsJsonNotation(): JsonNotation {
        return this.isGameStarted()
            ? this._chessEngine.getGameAsJsonNotation()
            : typeof this._board === "string"
              ? Converter.fenToJson(this._board)
              : this._board;
    }

    /**
     * Get the current board as fen notation.
     */
    public getGameAsFenNotation(): string {
        return this.isGameStarted()
            ? this._chessEngine.getGameAsFenNotation()
            : typeof this._board === "string"
              ? this._board
              : Converter.jsonToFen(this._board);
    }

    /**
     * Check if both players are online.
     */
    public areBothPlayersOnline(): boolean {
        return (
            !!this._whitePlayer &&
            this._whitePlayer.isOnline &&
            !!this._blackPlayer &&
            this._blackPlayer.isOnline
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
            this._whitePlayer?.token === player.token ||
            this._blackPlayer?.token === player.token
        );
    }

    /**
     * Get the color of the player.
     */
    public getColorOfPlayer(player: Player): Color | null {
        return this._whitePlayer?.token === player.token
            ? Color.White
            : this._blackPlayer?.token === player.token
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
            console.log(`Player[${player.id}] is already in the lobby[${this.id}].`);
            return true;
        }

        console.log(`Player[${player.id}] is not in the lobby[${this.id}].`);

        if (this._whitePlayer) {
            if (this._blackPlayer) {
                console.log(`Lobby[${this.id}] is full, player[${player.id}] can't join.`);
                return false;
            }
            this.setBlackPlayer(player);
        } else if (this._blackPlayer) {
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
        this._whitePlayer = player;
    }

    /**
     * Set the black player of the lobby.
     */
    private setBlackPlayer(player: Player): void {
        this._blackPlayer = player;
    }

    /**
     * Flip the colors of the players.
     */
    private flipColors(): void {
        if (this._whitePlayer && this._blackPlayer) {
            const temp = { ...this._whitePlayer };
            this.setWhitePlayer(this._blackPlayer!);
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
        this._gameTimeMonitorInterval = setInterval(() => {
            callback();
        }, 1000) as unknown as number;
    }

    /**
     * Clear the game time monitor interval.
     */
    public clearGameTimeMonitorInterval(): void {
        if (this._gameTimeMonitorInterval !== null)
            clearInterval(this._gameTimeMonitorInterval);

        this._gameTimeMonitorInterval = null;
    }

    /**
     * Check if the game is ready to start.
     */
    public isGameReadyToStart(): boolean {
        return (
            !!this._board &&
            !!this._durations &&
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
        ].includes(this._chessEngine.getGameStatus());
    }

    /**
     * Get the game status.
     */
    public getGameStatus(): GameStatus {
        return this._chessEngine.getGameStatus();
    }

    /**
     * Check if offer can be made.
     */
    private _canOffer(offerType: OfferType): boolean {
        if (this._activeOffer)
            return false;

        if (offerType === "Undo") {
            return this.isGameStarted() && !this.isGameFinished() && this._chessEngine.getMoveHistory().length >= 1
        } else if (offerType === "Draw") {
            return this.isGameStarted() && !this.isGameFinished() && this._chessEngine.getMoveHistory().length >= 2
        } else if (offerType === "PlayAgain") {
            return !this.isGameStarted() && this.isGameFinished()
        }

        return false;
    }

    /**
     * Set active offer.
     */
    public _acceptActiveOffer(playerWhoAcceptedOffer: Player, offerType: OfferType): boolean {
        if (!this._activeOffer) return false;
        if (this._activeOffer[0] === playerWhoAcceptedOffer) return false;
        if (this._activeOffer[1] !== offerType) return false;
        return true;
    }

    /**
     * Set active offer.
     */
    public setActiveOffer(player: Player, offerType: OfferType): boolean {
        if (!this._canOffer(offerType))
            return false;

        this._activeOffer = [player, offerType];
        return true;
    }

    /**
     * Get active offer.
     */
    public getActiveOffer(): ActiveOffer | null {
        return this._activeOffer;
    }

    /**
     * Remove active offer.
     */
    public removeActiveOffer(): boolean {
        if (!this._activeOffer) return false;
        this._activeOffer = null;
        return true;
    }

    /**
     * Finish the game as draw. This method should be used when
     * both players agree to finish the game as draw.
     */
    public abort(): boolean {
        if (this.isGameFinished() || this._chessEngine.getMoveHistory().length >= 2) return false;
        this._chessEngine.setGameStatus(GameStatus.ReadyToStart);
        return this.finishGame();
    }

    /**
     * Resign a player from the game.
     */
    public resign(player: Player): boolean {
        if (!this.isGameStarted() || this.isGameFinished() || this._chessEngine.getMoveHistory().length < 2) return false;
        const color = this.getColorOfPlayer(player);
        if (!color) return false;

        this._chessEngine.setGameStatus(
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
    public draw(player: Player): boolean {
        if (!this._acceptActiveOffer(player, "Draw")) return false;
        this._chessEngine.setGameStatus(GameStatus.Draw);
        return this.finishGame();
    }

    /**
     * Take back the last move. This method should be used when
     * both players agree to take back the last move.
     */
    public undo(playerWhoAcceptedOffer: Player): Color | false {
        if (!this._acceptActiveOffer(playerWhoAcceptedOffer, "Undo")) return false;
        const playerWhoMadeOffer = this._whitePlayer === playerWhoAcceptedOffer
            ? this._blackPlayer
            : this._whitePlayer;
        const undoColor = this.getColorOfPlayer(playerWhoMadeOffer!);
        if (!undoColor) return false;
        this._chessEngine.takeBack(undoColor);
        this.removeActiveOffer();
        this.updateLastPlayedAt();
        return undoColor;
    }

    /**
     *
     */
    public playAgain(player: Player): boolean {
        if (!this._acceptActiveOffer(player, "PlayAgain")) return false;
        return true;
    }

    /**
     * Make a move on the board.
     */
    public makeMove(player: Player, from: Square, to: Square): boolean {
        if (!this.isPlayerInLobby(player)) return false;
        if (!this.isGameStarted() || this.isGameFinished()) return false;
        if (this._chessEngine.getTurnColor() !== this.getColorOfPlayer(player)) return false;
        this._chessEngine.playMove(from, to);
        this.updateLastPlayedAt();
        // If the player moved when there was an active offer sent by opponent,
        // it means that player ignored the offer so remove it. We are understand
        // this by checking if the offerer (which is activeOffer[0]) isn't same
        // with player.
        const activeOffer = this.getActiveOffer();
        if (activeOffer && activeOffer[0] !== player) this.removeActiveOffer();
        return true;
    }

    /**
     * Start the game.
     */
    public startGame(): void {
        if (!this.isGameReadyToStart()) {
            console.log(`Game[${this.id}] in lobby not ready to start.`);
            return;
        }
        if (this._matchCount >= 2) this.flipColors();
        this._chessEngine.createGame({
            ...(typeof this._board === "string"
                ? Converter.fenToJson(this._board)
                : this._board),
            durations: JSON.parse(JSON.stringify(this._durations)),
        });
        this._isGameStarted = true;
        this._matchCount += 1;
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
                this._chessEngine.getMoveHistory().length < 2)
        );
    }
}
