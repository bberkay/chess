import type { Player, RWebSocket } from "../Types";
import { JsonNotation, StartPosition, Color, Durations, Duration } from "@Chess/Types";
import { Lobby } from "./Lobby";

/**
 * This class manages the lobbies of the game.
 */
export class LobbyManager{
    private static lobbies: Map<string, Lobby> = new Map();

    /**
     * Get the lobby by id.
     */
    static getLobby(lobbyId: string): Lobby | null
    {
        return LobbyManager.lobbies.get(lobbyId) || null;
    }

    /**
     * Check if the lobby exists.
     */
    static isLobbyExist(lobbyId: string): boolean
    {
        return LobbyManager.lobbies.has(lobbyId);
    }

    /**
     * Create a new lobby with the given board and duration.
     */
    static createLobby(
        board: StartPosition | JsonNotation | string,
        initialDuration: Duration
    ): string
    {
        const lobbyId = Math.floor(100000 + Math.random() * 900000).toString();
        if(this.isLobbyExist(lobbyId)) return this.createLobby(board, initialDuration);

        LobbyManager.lobbies.set(lobbyId, new Lobby(lobbyId, board, initialDuration));
        return lobbyId;
    }

    /**
     * Join player to the lobby with the given id.
     */
    static joinLobby(
        lobbyId: string, 
        player: Player
    ): Lobby | false
    {
        if (!this.isLobbyExist(lobbyId)){
            console.log("Lobby not found.");
            return false;
        }

        const lobby = this.getLobby(lobbyId)!;
        if(lobby.addPlayer(player))
            return lobby;

        return false;
    }

    /**
     * Leave player from the lobby with the given id. 
     */
    static leaveLobby(lobbyId: string, player: Player): boolean
    {
        if (!this.isLobbyExist(lobbyId)){
            console.log("Lobby not found.");
            return false;
        }

        const lobby = this.getLobby(lobbyId)!;
        lobby.setPlayerOffline(player);
        return true;
    }

    /**
     * Delete the empty lobbies.
     */
    static deleteEmptyLobbies(): void
    {
        
    }
}