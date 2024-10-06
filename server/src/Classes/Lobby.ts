import type { Player } from "../Types";
import { Color, Duration, Durations, GameStatus, JsonNotation, Square, StartPosition } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';
import { Converter } from "@Chess/Utils/Converter";
import { ID_LENGTH } from "src/Consts";
import { createRandomId, deepFreeze } from "./Helper";

/**
 * This class represents the lobby of the game.
 */
export class Lobby{
    public readonly id: string;

    private whitePlayer: Player | null = null;
    private blackPlayer: Player | null = null;
    private lastConnectedPlayerColor: Color | null = null;
    private gameTimeMonitorInterval: number | null = null;
    private isThereAnyOffer: boolean = false;

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
        this.board = board;
        this.durations = {
            [Color.White]: initialDuration,
            [Color.Black]: initialDuration
        };
    }

    /**
     * Get the white player of the lobby.
     */
    public getWhitePlayer(): Readonly<Player | null>
    {
        if(this.whitePlayer === null) return null;
        return deepFreeze({ ...this.whitePlayer });
    }

    /**
     * Get the black player of the lobby.
     */
    public getBlackPlayer(): Readonly<Player | null>
    {
        if(this.blackPlayer === null) return null;
        return deepFreeze({ ...this.blackPlayer });
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
     * Get the player id by color.
     */
    private getPlayerIdByColor(color: Color): string | null
    {
        return color === Color.White && this.whitePlayer !== null ? this.whitePlayer.id
            : color === Color.Black && this.blackPlayer !== null ? this.blackPlayer.id
                : null;
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
    public getInitialDurations(): Readonly<Durations>
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
        if(whitePlayer === null || !whitePlayer.isOnline)
            return false;

        const blackPlayer = this.getBlackPlayer();
        if(blackPlayer === null || !blackPlayer.isOnline)
            return false;

        return true;
    }

    /**
     * Check if both players are offline.
     */
    public isBothPlayersOffline(): boolean
    {
        const whitePlayer = this.getWhitePlayer();
        if(whitePlayer === null || whitePlayer.isOnline)
            return false;

        const blackPlayer = this.getBlackPlayer();
        if(blackPlayer === null || blackPlayer.isOnline)
            return false;

        return true;
    }

    /**
     * Is given player in the lobby.
     */
    public isPlayerInLobby(player: Player): boolean
    {
        const whitePlayer = this.getWhitePlayer();        
        if(whitePlayer && whitePlayer.name === player.name && whitePlayer.token === player.token) 
            return true;

        const blackPlayer = this.getBlackPlayer();
        if(blackPlayer && blackPlayer.name === player.name && blackPlayer.token === player.token) 
            return true;

        return false;
    }

    /**
     * Is there a player in the lobby that has the given user token?
     */
    public isTokenInLobby(token: string): boolean
    {
        const whitePlayer = this.getWhitePlayer();
        if(whitePlayer && whitePlayer.token === token) 
            return true;

        const blackPlayer = this.getBlackPlayer();
        if(blackPlayer && blackPlayer.token === token) 
            return true;

        return false;
    }

    /**
     * Is there a online player that has the given user token?
     */
    public isTokenOnline(token: string): boolean
    {
        const whitePlayer = this.getWhitePlayer();
        if(whitePlayer && whitePlayer.token === token) 
            return whitePlayer.isOnline;

        const blackPlayer = this.getBlackPlayer();
        if(blackPlayer && blackPlayer.token === token) 
            return blackPlayer.isOnline;

        return false;
    }

    /**
     * Get the color of the player that has the given user token(if exists).
     */
    public getTokenColor(token: string): Color | null
    {
        const whitePlayer = this.getWhitePlayer();
        if(whitePlayer !== null && whitePlayer.token === token) 
            return Color.White;

        const blackPlayer = this.getBlackPlayer();
        if(blackPlayer !== null && blackPlayer.token === token) 
            return Color.Black;

        return null;
    }

    /**
     * Get the name of the player that has the given user token(if exists).
     */
    public getTokenName(token: string): string | null
    {
        const color = this.getTokenColor(token);
        return color !== null ? this.getPlayerNameByColor(color) : null;
    }

    /**
     * Get the id of the player that has the given user token(if exists).
     */
    public getTokenId(token: string): string | null
    {
        const color = this.getTokenColor(token);
        return color !== null ? this.getPlayerIdByColor(color) : null;
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
     * Get the last connected player color if there is any.
     */
    public getLastConnectedPlayerColor(): Color | null
    {
        return this.lastConnectedPlayerColor;
    }

    /**
     * Add the player to the lobby.
     */
    public addPlayer(player: Player): boolean
    {
        if(this.isTokenInLobby(player.token))
        {
            // Reconnect the player with the same color
            if(this.isTokenOnline(player.token))
                return false;

            const color = this.getTokenColor(player.token) as Color;
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

            if(whitePlayer) {
                this.setBlackPlayer(player);
            } else if(blackPlayer) {
                this.setWhitePlayer(player);
            }
            else {
                const randomColor = Math.random() > 0.5 ? Color.White : Color.Black;
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
        if(!player.id)
            player.id = createRandomId(ID_LENGTH, this.getPlayerIdByColor(Color.Black));

        this.whitePlayer = player;
    }

    /**
     * Set the black player of the lobby.
     */
    private setBlackPlayer(player: Player): void
    {
        if(!player.id)
            player.id = createRandomId(ID_LENGTH, this.getPlayerIdByColor(Color.White));

        this.blackPlayer = player;
    }

    /**
     * Flip the colors of the players.
     */
    private flipColors(): void
    {
        if(this.getWhitePlayer() && this.getBlackPlayer())
        {
            const temp = {...this.whitePlayer};
            this.setWhitePlayer(this.blackPlayer!);
            this.setBlackPlayer(temp as Player);
        }
    }

    /**
     * Set the player as online in the lobby.
     */
    public setPlayerOnline(player: Player): void
    {
        if(this.isPlayerInLobby(player)){
            player.isOnline = true;
            this.lastConnectedPlayerColor = this.getTokenColor(player.token) as Color;
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
        return this.chessEngine.getTurnColor() == this.getTokenColor(player.token);
    }

    /**
     * Check if the player can participate in the game.
     */
    public canPlayerParticipate(player: Player, isGameShouldBeInPlay: boolean = true): boolean
    {
        if(isGameShouldBeInPlay && !this.isGameStarted()) return false;
        if(isGameShouldBeInPlay && this.isGameFinished()) return false;
        if(!this.isPlayerInLobby(player)) return false;
        if(!this.getTokenColor(player.token)) return false;
        return true;
    }

    /**
     * Check if there is any offer in the lobby.
     */
    public isOffersOnCooldown(): boolean
    {
        return this.isThereAnyOffer;
    }

    /**
     * Enable the offer cooldown to prevent the 
     * players to offer something again.
     */
    public enableOfferCooldown(): void
    {
        this.isThereAnyOffer = true;
    }

    /**
     * Disable the offer cooldown to allow the
     * players to offer something.
     */
    public disableOfferCooldown(): void
    {
        this.isThereAnyOffer = false;
    }

    /**
     * Resign a player from the game.
     */
    public resign(player: Player): void
    {
        const color = this.getTokenColor(player.token);
        if(!color) return;

        this.chessEngine.setGameStatus(color == Color.White 
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

        this.disableOfferCooldown();
        this.flipColors();
        this.chessEngine.createGame({
            ...(typeof this.board === "string" ? Converter.fenToJson(this.board) : this.board),
            durations: JSON.parse(JSON.stringify(this.getInitialDurations())) 
        });
    }
}