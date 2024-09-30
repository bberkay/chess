import type { Player } from "../Types";
import { Color, Duration, Durations, GameStatus, JsonNotation, Square, StartPosition } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';
import { Converter } from "@Chess/Utils/Converter";

/**
 * This class represents the lobby of the game.
 */
export class Lobby{
    public readonly lobbyId: string;

    private whitePlayer: Player | null = null;
    private blackPlayer: Player | null = null;
    
    private chessEngine: ChessEngine = new ChessEngine();
    private _isGameStarted: boolean = false;

    // Inital values
    private readonly board: StartPosition | JsonNotation | string; 
    private readonly durations: Durations;

    /**
     * Constructor of the Lobby class.
     */
    public constructor(
        lobbyId: string, 
        board: StartPosition | JsonNotation | string = StartPosition.Standard,
        initialDuration: Duration
    ){
        this.lobbyId = lobbyId;
        this.durations = {[Color.White]: initialDuration, [Color.Black]: initialDuration};
        this.board = board;
    }

    /**
     * Get the white player of the lobby.
     */
    public getWhitePlayer(): Readonly<Player | null>
    {
        if(this.whitePlayer === null) return null;
        return Object.freeze({ ...this.whitePlayer });
    }

    /**
     * Get the black player of the lobby.
     */
    public getBlackPlayer(): Readonly<Player | null>
    {
        if(this.blackPlayer === null) return null;
        return Object.freeze({ ...this.blackPlayer });
    }

    /**
     * Get the player name by color.
     */
    private getPlayerNameByColor(color: Color): string | null
    {
        return color === Color.White && this.whitePlayer !== null ? this.whitePlayer.name
            : color === Color.Black && this.blackPlayer !== null ? this.blackPlayer.name
                : null;
    }

    /**
     * Get the white player's name.
     */
    public getWhitePlayerName(): string | null
    {
        return this.getPlayerNameByColor(Color.White);
    }

    /**
     * Get the black player's name.
     */
    public getBlackPlayerName(): string | null
    {
        return this.getPlayerNameByColor(Color.Black);
    }

    /**
     * Get the duration of the game.
     */
    public getCurrentDurations(): Durations
    {
        const currentRemaining = this.chessEngine.getPlayersRemainingTime();
        return {
            [Color.White]: {
                remaining: currentRemaining[Color.White],
                increment: this.durations[Color.White].increment
            }, 
            [Color.Black]: {
                remaining: currentRemaining[Color.Black],
                increment: this.durations[Color.Black].increment
            },
        };
    }

    /**
     * Get the current board of the game.
     */
    public getCurrentBoard(): string | JsonNotation
    {
        return this.isGameStarted() ? this.chessEngine.getGameAsJsonNotation() : this.getInitialBoard();
    }

    /**
     * Get the initial durations of the game.
     */
    public getInitialDurations(): Durations
    {
        return this.durations;
    }

    /**
     * Get the initial board of the game.
     */
    public getInitialBoard(): StartPosition | JsonNotation | string
    {
        return this.board;
    }

    /**
     * Check if both players are online.
     */
    public isBothPlayersOnline(): boolean
    {
        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        return whitePlayer !== null && whitePlayer.isOnline && blackPlayer !== null && blackPlayer.isOnline;
    }

    /**
     * Check if both players are offline.
     */
    public isBothPlayersOffline(): boolean
    {
        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        return whitePlayer !== null && !whitePlayer.isOnline && blackPlayer !== null && !blackPlayer.isOnline;
    }

    /**
     * Is given player in the lobby.
     */
    public isPlayerInLobby(player: Player): boolean
    {
        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        if(whitePlayer && whitePlayer.name === player.name 
            && whitePlayer.color === player.color && whitePlayer.userToken === player.userToken) 
            return true;

        if(blackPlayer && blackPlayer.name === player.name
                && blackPlayer.color === player.color && blackPlayer.userToken === player.userToken) 
            return true;

        return false;
    }

    /**
     * Is there a player in the lobby that has the given user token?
     */
    public isTokenInLobby(userToken: string): boolean
    {
        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        if(whitePlayer && whitePlayer.userToken === userToken) return true;
        if(blackPlayer && blackPlayer.userToken === userToken) return true;
        return false;
    }

    /**
     * Is there a online player that has the given user token?
     */
    public isTokenOnline(userToken: string): boolean
    {
        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        if(whitePlayer && whitePlayer.userToken === userToken) 
            return whitePlayer.isOnline;
        if(blackPlayer && blackPlayer.userToken === userToken) 
            return blackPlayer.isOnline;
        return false;
    }

    /**
     * Get the color of the player that has the given user token(if exists).
     */
    public getTokenColor(userToken: string): Color | null
    {
        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        if(whitePlayer !== null && whitePlayer.userToken === userToken) 
            return Color.White;
        if(blackPlayer !== null && blackPlayer.userToken === userToken) 
            return Color.Black;
        return null;
    }

    /**
     * Get the name of the player that has the given user token(if exists).
     */
    public getTokenName(userToken: string): string | null
    {
        const color = this.getTokenColor(userToken);
        return color !== null ? this.getPlayerNameByColor(color) : null;
    }

    /**
     * Add the player to the lobby.
     */
    public addPlayer(player: Player): boolean
    {
        if(this.isTokenInLobby(player.userToken))
        {
            // Reconnect the player with the same color
            if(this.isTokenOnline(player.userToken))
                return false;

            const color = this.getTokenColor(player.userToken);
            if(color === Color.White) 
                this.setWhitePlayer(player);
            else if(color === Color.Black) 
                this.setBlackPlayer(player);

            this.setPlayerOnline(player);
        }
        else
        {
            // Add the player to the lobby with the random color 
            // if there is no player unless add with available color. 
            const whitePlayer = this.getWhitePlayer();
            const blackPlayer = this.getBlackPlayer();
            if(whitePlayer && blackPlayer)
                return false;   

            if(whitePlayer)
                this.setBlackPlayer(player);
            else if(blackPlayer)
                this.setWhitePlayer(player);
            else
            {
                let randomColor = Math.random() > 0.5 ? Color.White : Color.Black;
                if(randomColor == Color.White)
                    this.setWhitePlayer(player);
                else if(randomColor == Color.Black)
                    this.setBlackPlayer(player);
            }

            this.setPlayerOnline(player);
        }
        
        return true;
    }

    /**
     * Set the white player of the lobby.
     */
    private setWhitePlayer(player: Player): void
    {
        this.whitePlayer = player;
        this.whitePlayer.color = Color.White;
    }

    /**
     * Set the black player of the lobby.
     */
    private setBlackPlayer(player: Player): void
    {
        this.blackPlayer = player;
        this.blackPlayer.color = Color.Black;
    }

    /**
     * Set the player as online in the lobby.
     */
    public setPlayerOnline(player: Player): void
    {
        if(this.isPlayerInLobby(player))
            player.isOnline = true;
    }

    /**
     * Set the player as offline in the lobby.
     */
    public setPlayerOffline(player: Player): void
    {
        if(this.isPlayerInLobby(player))
            player.isOnline = false;
    }
    
    /**
     * Check if the game is ready to start.
     */
    public isGameReadyToStart(): boolean
    {
        if(this.isGameStarted()) return false;
        if(!this.board) return false;
        if(this.durations[Color.White].remaining <= 0 || this.durations[Color.White].increment < 0
            || this.durations[Color.Black].remaining <= 0 || this.durations[Color.Black].increment < 0) 
            return false;

        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        if(whitePlayer === null || blackPlayer === null) return false;
        if(!whitePlayer.isOnline || !blackPlayer.isOnline) return false;

        return true;
    }

    /**
     * Check if the game is already started.
     */
    public isGameStarted(): boolean
    {
        return this._isGameStarted;
    }

    /**
     * Check if the game is finished.
     */
    public isGameFinished(): boolean
    {
        return [
            GameStatus.BlackVictory, 
            GameStatus.WhiteVictory, 
            GameStatus.Draw
        ].includes(this.chessEngine.getGameStatus());
    }

    /**
     * Get the game status.
     */
    public getGameStatus(): GameStatus
    {
        return this.chessEngine.getGameStatus();
    }
    
    /**
     * Check if the player can make a move.
     */
    public canPlayerMakeMove(player: Player): boolean
    {
        if(!this.isGameStarted()) return false;
        if(this.isGameFinished()) return false;
        if(!this.isPlayerInLobby(player)) return false;
        if(!player.color) return false;
        return this.chessEngine.getTurnColor() == player.color;
    }

    /**
     * Make a move on the board.
     */
    public makeMove(from: Square, to: Square): void
    {
        if(!this.isGameStarted()) return;
        this.chessEngine.playMove(from, to);
    }

    /**
     * Start the game.
     */
    public startGame(): void
    {
        if(this.isGameStarted() || !this.isGameReadyToStart()) 
            return;

        try{
            this.chessEngine.createGame({
                ...(typeof this.board === "string" ? Converter.fenToJson(this.board) : this.board),
                durations: this.durations
            });
            if(this.chessEngine.getGameStatus() == GameStatus.ReadyToStart)
                this._isGameStarted = true;
        }catch(e){
            console.log("There was an error while playing the game on engine.");
            return;
        }
    }

}