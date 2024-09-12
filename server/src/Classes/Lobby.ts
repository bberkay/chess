import { Color, type Player } from "../Types";
import { GameStatus, JsonNotation, StartPosition } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';

/**
 * This class represents the lobby of the game.
 */
export class Lobby{
    private readonly lobbyId: string;
    private whitePlayer: Player | null = null;
    private blackPlayer: Player | null = null;
    private chessEngine: ChessEngine = new ChessEngine();
    private isGameStarted: boolean = false;

    // total time(in minutes), increment time(in seconds)
    private readonly duration: [number, number]; 

    // initial board position
    private readonly board: StartPosition | JsonNotation | string; 

    /**
     * Constructor of the Lobby class.
     */
    public constructor(
        lobbyId: string, 
        board: StartPosition | JsonNotation | string = StartPosition.Standard,
        duration: [number, number]
    ){
        this.lobbyId = lobbyId;
        this.duration = duration;
        this.board = board;
    }

    /**
     * Get the id of the lobby.
     */
    public getId(): string
    {
        return this.lobbyId;
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
    public getDuration(): [number, number]
    {
        return this.duration;
    }

    /**
     * Get the current board of the game.
     */
    public getCurrentBoard(): string | JsonNotation
    {
        return this.chessEngine.getGameAsJsonNotation();
    }

    /**
     * Get the initial board of the game.
     */
    public getInitialBoard(): StartPosition | JsonNotation | string
    {
        return this.board;
    }

    /**
     * Is given player in the lobby.
     * @param objectCheck If true, it checks the player object.
     * If false, it checks the name, userToken and color.
     */
    public isPlayerInLobby(player: Player, objectCheck: boolean = true): boolean
    {
        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        if(objectCheck){
            if(whitePlayer === player || blackPlayer === player) 
                return true;
            else
                return false;
        }
        else{
            if(whitePlayer && whitePlayer.name === player.name 
                && whitePlayer.color === player.color && whitePlayer.userToken === player.userToken) 
                return true;

            if(blackPlayer && blackPlayer.name === player.name
                    && blackPlayer.color === player.color && blackPlayer.userToken === player.userToken) 
                return true;
        }

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
        if(whitePlayer && whitePlayer.userToken === userToken) return whitePlayer.isOnline;
        if(blackPlayer && blackPlayer.userToken === userToken) return blackPlayer.isOnline;
        return false;
    }

    /**
     * Get the color of the player that has the given user token(if exists).
     */
    public getTokenColor(userToken: string): Color | null
    {
        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        if(whitePlayer !== null && whitePlayer.userToken === userToken) return Color.White;
        if(blackPlayer !== null && blackPlayer.userToken === userToken) return Color.Black;
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
            if(color === Color.White) this.whitePlayer = player;
            else if(color === Color.Black) this.blackPlayer = player;
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
     * Remove the player from the lobby.
     */
    public removePlayer(player: Player, isDisconnected: boolean = false): boolean
    {
        if(!this.isPlayerInLobby(player, false)) return false;

        if(isDisconnected)
            this.setPlayerOffline(player);
        else
        {
            if(this.getWhitePlayer() === player) this.whitePlayer = null;
            else if(this.getBlackPlayer() === player) this.blackPlayer = null;
        }

        return true;
    }

    /**
     * Set the white player of the lobby.
     */
    private setWhitePlayer(player: Player): void
    {
        this.whitePlayer = player;
        player.color = Color.White;
    }

    /**
     * Set the black player of the lobby.
     */
    private setBlackPlayer(player: Player): void
    {
        this.blackPlayer = player;
        player.color = Color.Black;
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
        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        if(this.isGameAlreadyStarted()) return false;
        if(!this.board) return false;
        if(whitePlayer === null || blackPlayer === null) return false;
        if(!whitePlayer.isOnline || !blackPlayer.isOnline) return false;
        if(this.duration[0] <= 0 || this.duration[1] <= 0) return false;
        return true;
    }

    /**
     * Check if the game is already started.
     */
    public isGameAlreadyStarted(): boolean
    {
        return this.isGameStarted;
    }

    /**
     * Start the game.
     */
    public startGame(): void
    {
        if(this.isGameAlreadyStarted()) return;

        if(!this.isGameReadyToStart()) return;

        try{
            this.chessEngine.createGame(this.board);
            if(this.chessEngine.getGameStatus() == GameStatus.ReadyToStart){
                this.isGameStarted = true;
                console.log("Game is started.");
            }
            //engine.playMove(move.from, move.to);
        }catch(e){
            console.log("There was an error while playing the game on engine.");
            return;
        }
    }

}