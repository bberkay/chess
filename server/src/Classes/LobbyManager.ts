import { Color, type Player } from "../Types";
import { Lobby } from "./Lobby";

export class LobbyManager{
    private static lobbies: Map<string, Lobby> = new Map<string, Lobby>();
    
    static getLobby(lobbyId: string): Lobby | null
    {
        return LobbyManager.lobbies.get(lobbyId) || null;
    }

    static isLobbyExist(lobbyId: string): boolean
    {
        return LobbyManager.lobbies.has(lobbyId);
    }

    static createLobby(): string
    {
        const lobbyId = Math.floor(100000 + Math.random() * 900000).toString();
        if(this.isLobbyExist(lobbyId)) return this.createLobby();

        LobbyManager.lobbies.set(lobbyId, new Lobby(lobbyId));
        return lobbyId;
    }

    static joinLobby(player: Player): boolean
    {
        const lobbyId = player.data.lobbyId;
        if (!this.isLobbyExist(lobbyId)){
            console.log("Lobby not found.");
            return false;
        }

        const lobby = this.getLobby(lobbyId)!;
        if(lobby.getWhitePlayer() && lobby.getBlackPlayer()){
            console.log("Lobby is full.");
            return false;
        }

        let randomColor = Math.random() > 0.5 ? Color.White : Color.Black;
        if(
            (randomColor == Color.White && lobby.getWhitePlayer()) 
            || (randomColor == Color.Black && lobby.getBlackPlayer())
        )
            randomColor = randomColor === Color.White ? Color.Black : Color.White;

        lobby.addPlayer(player, randomColor);
        return true;
    }

    static leaveLobby(player: Player): void
    {
        const lobbyId = player.data.lobbyId;
        if(!this.isLobbyExist(lobbyId)){
            console.log("Lobby not found.");
            return;
        }

        const lobby = this.getLobby(lobbyId)!;
        const color = lobby.getPlayerColor(player);
        if(!color){
            console.log("Player not found.");
            return;
        }

        lobby.removePlayerByColor(color);

        if(lobby.getWhitePlayer() === null && lobby.getBlackPlayer() === null)
            LobbyManager.lobbies.delete(lobbyId);

        return;
    }
}