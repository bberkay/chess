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
     */
    public isPlayerInLobby(player: Player): boolean
    {
        const isInLobby = this.getWhitePlayer() === player || this.getBlackPlayer() === player;
        if(!isInLobby) console.log("Player is not in the lobby: ", player);
        else console.log("Player is in the lobby: ", player);
        return isInLobby;
    }

    /**
     * Is there a player in the lobby that has the given user token?
     */
    public isTokenInLobby(userToken: string): boolean
    {
        return this.getWhitePlayer() !== null && this.getWhitePlayer()!.userToken === userToken
            || this.getBlackPlayer() !== null && this.getBlackPlayer()!.userToken === userToken;
    }

    /**
     * Is there a online player that has the given user token?
     */
    public isTokenOnline(userToken: string): boolean
    {
        return this.getWhitePlayer() !== null && this.getWhitePlayer()!.userToken === userToken
            ? this.getWhitePlayer()!.isOnline
            : this.getBlackPlayer() !== null && this.getBlackPlayer()!.userToken === userToken
                ? this.getBlackPlayer()!.isOnline
                : false;
    }

    /**
     * Get the color of the player that has the given user token(if exists).
     */
    public getTokenColor(userToken: string): Color | null
    {
        if(this.getWhitePlayer() !== null && this.getWhitePlayer()!.userToken === userToken)
            return Color.White;
        if(this.getBlackPlayer() !== null && this.getBlackPlayer()!.userToken === userToken)
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
     * Set the player to the lobby with the given color.
     */
    public addPlayer(player: Player): boolean
    {
        if(this.isTokenInLobby(player.userToken)){
            // Reconnect the player with the same color
            if(this.isTokenOnline(player.userToken)){
                console.log("Player is already in the lobby.");
                return false;
            }

            const color = this.getTokenColor(player.userToken);
            if(color === Color.White) this.whitePlayer = player;
            else if(color === Color.Black) this.blackPlayer = player;
            this.setPlayerOnline(player);
        }
        else
        {
            // Add player to the lobby with random color
            if(this.getWhitePlayer() && this.getBlackPlayer()){
                console.log("Lobby is full.");
                return false;   
            }

            let randomColor = Math.random() > 0.5 ? Color.White : Color.Black;
            if(randomColor == Color.White){
                if(this.getWhitePlayer()){
                    this.blackPlayer = player;
                    player.color = Color.Black;
                } 
                else{
                    this.whitePlayer = player;
                    player.color = Color.White;
                } 
            }
            else if(randomColor == Color.Black){
                if(this.getBlackPlayer()){
                    this.whitePlayer = player;
                    player.color = Color.White;
                } 
                else{
                    this.blackPlayer = player;
                    player.color = Color.Black;
                } 
            }

            this.setPlayerOnline(player);
        }
        
        console.log("Player is added to the lobby: ", player);
        return true;
    }

    /**
     * Remove the player from the lobby.
     */
    public removePlayer(player: Player, isDisconnected: boolean = false): boolean
    {
        if(!this.isPlayerInLobby(player)) return false;

        if(isDisconnected){
            this.setPlayerOffline(player);
        }
        else{
            if(this.getWhitePlayer() === player) this.whitePlayer = null;
            else if(this.getBlackPlayer() === player) this.blackPlayer = null;
        }

        console.log("Player is removed from the lobby: ", player);
        return true;
    }

    /**
     * Set the player as online in the lobby.
     */
    public setPlayerOnline(player: Player): void
    {
        if(this.isPlayerInLobby(player))
            player.isOnline = true;
        else
            console.log("Player couldn't be set as online");
    }

    /**
     * Set the player as offline in the lobby.
     */
    public setPlayerOffline(player: Player): void
    {
        if(this.isPlayerInLobby(player))
            player.isOnline = false;
        else
            console.log("Player couldn't be set as offline");
    }
    
    /**
     * Check if the game is ready to start.
     */
    public isGameReadyToStart(): boolean
    {
        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        const result = !this.isGameAlreadyStarted() 
            && whitePlayer !== null && blackPlayer !== null 
                && whitePlayer.isOnline && blackPlayer.isOnline
                    && this.duration[0] > 0 && this.duration[1] >= 0;
        if(!result) console.log("Game is not ready to start.");
        else console.log("Game is ready to start.");
        return result;
    }

    /**
     * Check if the game is already started.
     */
    public isGameAlreadyStarted(): boolean
    {
        if(this.isGameStarted) console.log("Game is already started.");
        else console.log("Game is not started yet.");
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