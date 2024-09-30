import type { Player, RWebSocket } from "../Types";
import { JsonNotation, StartPosition, Color, Durations, Duration } from "@Chess/Types";
import { Lobby } from "./Lobby";
import { createRandomId } from "./Helper";
import { ID_LENGTH } from "../Types";

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
        const lobbyId = createRandomId(ID_LENGTH);
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
        const lobby = this.getLobby(lobbyId);
        if (!lobby)
            return false;

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
     * Delete the lobby with the given id if the both players 
     * are offline and the game is finished or not started.
     */
    static deleteLobbyIfDead(lobbyId: string): void
    {
        const lobby = this.getLobby(lobbyId);
        if (!lobby) return;

        if (lobby.isBothPlayersOffline() && (lobby.isGameFinished() || !lobby.isGameStarted()))
            this.lobbies.delete(lobbyId);
    }
}