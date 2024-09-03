import { type WebSocketData, Color, type Player, type Lobby } from "../Types";
import { JsonNotation, StartPosition } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';

export class LobbyManager{
    private static lobbies: Map<string, Lobby> = new Map<string, Lobby>();
    
    static isLobbyExist(lobbyId: string): boolean
    {
        return LobbyManager.lobbies.has(lobbyId);
    }

    static getBoard(lobbyId: string): string | JsonNotation | null
    {
        if(!this.isLobbyExist(lobbyId)) return null;
        return LobbyManager.lobbies.get(lobbyId)!.Board;
    }

    static getWhitePlayer(lobbyId: string): Player | null
    {
        if(!this.isLobbyExist(lobbyId)) return null;
        return LobbyManager.lobbies.get(lobbyId)!.Players[Color.White];
    }

    static getBlackPlayer(lobbyId: string): Player | null
    {
        if(!this.isLobbyExist(lobbyId)) return null;
        return LobbyManager.lobbies.get(lobbyId)!.Players[Color.Black];
    }

    static getPlayerColor(player: Player): Color | null
    {
        const lobbyId = player.data.lobbyId;
        if(!this.isLobbyExist(lobbyId)) return null;

        if(this.getWhitePlayer(lobbyId) === player) return Color.White;
        if(this.getBlackPlayer(lobbyId) === player) return Color.Black;
        return null;
    }

    static createLobby(): string
    {
        const lobbyId = Math.floor(100000 + Math.random() * 900000).toString();
        if(this.isLobbyExist(lobbyId)) return this.createLobby();

        LobbyManager.lobbies.set(lobbyId, {
            Players:{
                [Color.White]: null,
                [Color.Black]: null
            },
            Board: StartPosition.Standard
        });
        return lobbyId;
    }

    static joinLobby(player: Player): boolean
    {
        const lobbyId = player.data.lobbyId;
        if (!this.isLobbyExist(lobbyId)){
            console.log("Lobby not found.");
            return false;
        }

        if(this.getWhitePlayer(lobbyId) && this.getBlackPlayer(lobbyId)){
            console.log("Lobby is full.");
            return false;
        }

        let randomColor = Math.random() > 0.5 ? Color.White : Color.Black;
        if(
            (randomColor == Color.White && this.getWhitePlayer(lobbyId)) 
            || (randomColor == Color.Black && this.getBlackPlayer(lobbyId))
        )
            randomColor = randomColor === Color.White ? Color.Black : Color.White;

        LobbyManager.lobbies.get(lobbyId)!.Players[randomColor] = player;
        return true;
    }

    static leaveLobby(player: Player): void
    {
        const lobbyId = player.data.lobbyId;
        if(!this.isLobbyExist(lobbyId)){
            console.log("Lobby not found.");
            return;
        }

        const color = this.getPlayerColor(player);
        if(color === null){
            console.log("Player not found.");
            return;
        }

        LobbyManager.lobbies.get(lobbyId)!.Players[color] = null;

        if(this.getWhitePlayer(lobbyId) === null && this.getBlackPlayer(lobbyId) === null)
            LobbyManager.lobbies.delete(lobbyId);

        return;
    }

    static isLobbyReady(lobbyId: string): boolean
    {
        if(!this.isLobbyExist(lobbyId)){
            console.log("Lobby not found.");
            return false;
        }

        return this.getWhitePlayer(lobbyId) !== null && this.getBlackPlayer(lobbyId) !== null;
    }

    static startGame(lobbyId: string): void
    {
        const white = this.getWhitePlayer(lobbyId);
        const black = this.getBlackPlayer(lobbyId);

        if(!white || !black){
            console.log("Game cannot be started.");
            return;
        }

        try{
            // Create chess board on engine.
            const engine = new ChessEngine();
            engine.createGame(this.getBoard(lobbyId)!);
            //engine.playMove(move.from, move.to);
        }catch(e){
            console.log("There was an error while playing the game on engine.");
            return;
        }
    }
}