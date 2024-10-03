import type { Player } from "../Types";
import { Color, Duration, Durations, GameStatus, JsonNotation, Square, StartPosition } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';
import { Converter } from "@Chess/Utils/Converter";

/**
 * This class represents the lobby of the game.
 */
export class Lobby{
    public readonly id: string;

    private whitePlayer: Player | null = null;
    private blackPlayer: Player | null = null;
    private lastConnectedPlayerColor: Color | null = null;
    private gameTimeMonitorInterval: number | null = null;
    
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
    ){
        this.id = id;
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
     * Get the current board of the game.
     */
    public getCurrentGame(): string | JsonNotation
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
     * Get the last connected player if there is any.
     */
    public getLastConnectedPlayer(): Player | null
    {
        const color = this.lastConnectedPlayerColor;
        return color === Color.White ? this.getWhitePlayer() 
            : color === Color.Black ? this.getBlackPlayer()
                : null;
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
        if(this.isPlayerInLobby(player)){
            player.isOnline = true;
            this.lastConnectedPlayerColor = player.color;
        }
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
     * Set the game time monitor interval id for 
     * clearing the interval when the game is finished.
     */
    public setGameTimeMonitorInterval(interval: number): void
    {
        this.gameTimeMonitorInterval = interval;
    }

    /**
     * Clear the game time monitor interval.
     */
    public clearGameTimeMonitorInterval(): void
    {
        if(this.gameTimeMonitorInterval !== null)
            clearInterval(this.gameTimeMonitorInterval);

        this.gameTimeMonitorInterval = null;
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
        return ![
            GameStatus.NotReady, 
            GameStatus.BlackVictory, 
            GameStatus.WhiteVictory,
            GameStatus.Draw
        ].includes(this.chessEngine.getGameStatus());
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
        this.canPlayerParticipate(player);
        return this.chessEngine.getTurnColor() == player.color;
    }

    /**
     * Check if the player can participate in the game.
     */
    public canPlayerParticipate(player: Player, isGameShouldBeInPlay: boolean = true): boolean
    {
        if(!this.isGameStarted()) return false;
        if(isGameShouldBeInPlay && this.isGameFinished()) return false;
        if(!this.isPlayerInLobby(player)) return false;
        if(!player.color) return false;
        return true;
    }

    /**
     * Check if any player is on offer cooldown.
     */
    public isOffersOnCooldown(): boolean
    {
        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        return (whitePlayer !== null && whitePlayer.isOnOfferCooldown)
            || (blackPlayer !== null && blackPlayer.isOnOfferCooldown);
    }

    /**
     * Set the player's offer cooldown.
     */
    public setOfferCooldown(player: Player): void
    {
        if(this.isPlayerInLobby(player))
            player.isOnOfferCooldown = true;
    }

    /**
     * Reset the players' offer cooldowns.
     */
    public resetOfferCooldowns(): void
    {
        if(this.whitePlayer !== null)
            this.whitePlayer.isOnOfferCooldown = false;
        if(this.blackPlayer !== null)
            this.blackPlayer.isOnOfferCooldown = false;
    }

    /**
     * Resign a player from the game.
     */
    public resign(player: Player): void
    {
        this.chessEngine.setGameStatus(player.color == Color.White 
            ? GameStatus.BlackVictory 
            : GameStatus.WhiteVictory
        );
    }

    /**
     * Finish the game as draw. This method is used when
     * both players agree to finish the game as draw.
     * (WsCommand.Finished.isDrawOffered is set to true).
     */
    public draw(): void
    {
        this.chessEngine.setGameStatus(GameStatus.Draw);
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
        if(!this.isGameReadyToStart()) 
            return;

        this.resetOfferCooldowns();
        try{
            this.chessEngine.createGame({
                ...(typeof this.board === "string" ? Converter.fenToJson(this.board) : this.board),
                durations: this.durations
            });
        }catch(e){
            console.log("There was an error while playing the game on engine.");
            return;
        }
    }
}