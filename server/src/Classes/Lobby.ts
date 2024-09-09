import { Color, type Player } from "../Types";
import { JsonNotation, StartPosition } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';

export class Lobby{
    private readonly lobbyId: string;
    private players: {[Color.White]: Player | null, [Color.Black]: Player | null};
    private isGameStarted: boolean = false;
    private chessEngine: ChessEngine = new ChessEngine();
    private board: StartPosition | JsonNotation | string;

    public constructor(lobbyId: string){
        this.lobbyId = lobbyId;
        this.players = {
            [Color.White]: null,
            [Color.Black]: null
        };
        this.board = StartPosition.Standard;
    }

    public getId(): string
    {
        return this.lobbyId;
    }

    public getWhitePlayer(): Player | null
    {
        return this.players[Color.White];
    }

    public getBlackPlayer(): Player | null
    {
        return this.players[Color.Black];
    }

    public getPlayerColor(player: Player): Color | null
    {
        if(this.getWhitePlayer() === player) return Color.White;
        if(this.getBlackPlayer() === player) return Color.Black;
        return null;
    }

    public getPlayerName(player: Player): string | null
    {
        const color = this.getPlayerColor(player);
        if(color === null) return null;
        return this.players[color]!.data.playerName || null;
    }

    public getPlayerColorByToken(userToken: string): Color | null
    {
        if(this.getWhitePlayer() !== null && this.getWhitePlayer()!.data.userToken === userToken)
            return Color.White;
        if(this.getBlackPlayer() !== null && this.getBlackPlayer()!.data.userToken === userToken)
            return Color.Black;
        return null;
    }

    public getPlayerNameByToken(userToken: string): string | null
    {
        if(this.getWhitePlayer() !== null && this.getWhitePlayer()!.data.userToken === userToken)
            return this.getPlayerName(this.getWhitePlayer()!);
        if(this.getBlackPlayer() !== null && this.getBlackPlayer()!.data.userToken === userToken)
            return this.getPlayerName(this.getBlackPlayer()!);
        return null;
    }

    public isPlayerOnlineByColor(color: Color): boolean
    {
        return this.players[color] !== null && this.players[color]!.data.isOnline;
    }

    public isPlayerOnlineByToken(userToken: string): boolean
    {
        return this.getWhitePlayer() !== null && this.getWhitePlayer()!.data.userToken === userToken
            ? this.getWhitePlayer()!.data.isOnline
            : this.getBlackPlayer() !== null && this.getBlackPlayer()!.data.userToken === userToken
                ? this.getBlackPlayer()!.data.isOnline
                : false;
    }

    public setPlayer(player: Player, color: Color): void
    {
        this.players[color] = player;
        this.setPlayerOnline(player);
    }

    public setPlayerOffline(player: Player): void
    {
        const color = this.getPlayerColor(player);
        if(color === null) return;
        this.players[color]!.data.isOnline = false;
    }

    public setPlayerOnline(player: Player): void
    {
        const color = this.getPlayerColor(player);
        if(color === null) return;
        this.players[color]!.data.isOnline = true;
    }

    public removePlayer(player: Player): void
    {
        const color = this.getPlayerColor(player);
        if(color === null) return;
        this.removePlayerByColor(color);
    }

    public removePlayerByColor(color: Color): void
    {
        this.players[color] = null;
    }
    
    public isGameReadyToStart(): boolean
    {
        const whitePlayer = this.getWhitePlayer();
        const blackPlayer = this.getBlackPlayer();
        return whitePlayer !== null && blackPlayer !== null && whitePlayer.data.isOnline && blackPlayer.data.isOnline;
    }

    public isGameAlreadyStarted(): boolean
    {
        return this.isGameStarted;
    }

    public startGame(): void
    {
        if(this.isGameStarted) return;

        if(!this.isGameReadyToStart()){
            console.log("Game cannot be started.");
            return;
        }

        try{
            this.chessEngine.createGame(this.board);
            this.isGameStarted = true;
            //engine.playMove(move.from, move.to);
        }catch(e){
            console.log("There was an error while playing the game on engine.");
            return;
        }
    }

    public getBoard(): string | JsonNotation
    {
        return this.chessEngine.getGameAsJsonNotation();
    }
}