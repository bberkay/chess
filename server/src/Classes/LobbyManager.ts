import type { Player } from "../Types";
import { JsonNotation, StartPosition, Duration } from "@Chess/Types";
import { Lobby } from "./Lobby";
import { createRandomId } from "./Helper";
import { GU_ID_LENGTH } from "../Consts";

/**
 * This class manages the lobbies of the game.
 */
export class LobbyManager {
    private static lobbies: Map<string, Lobby> = new Map();

    /**
     * Get the lobby by id.
     */
    static getLobby(lobbyId: string): Lobby | null {
        return LobbyManager.lobbies.get(lobbyId) || null;
    }

    /**
     * Check if the lobby exists.
     */
    static isLobbyExist(lobbyId: string): boolean {
        return LobbyManager.lobbies.has(lobbyId);
    }

    /**
     * Create a new lobby with the given board and duration.
     */
    static createLobby(
        board: StartPosition | JsonNotation | string,
        initialDuration: Duration
    ): string {
        const lobbyId = createRandomId(GU_ID_LENGTH, [
            ...LobbyManager.lobbies.keys(),
        ]);
        LobbyManager.lobbies.set(
            lobbyId,
            new Lobby(lobbyId, board, initialDuration)
        );
        return lobbyId;
    }

    /**
     * Join player to the lobby with the given id.
     */
    static joinLobby(lobbyId: string, player: Player): boolean {
        const lobby = this.getLobby(lobbyId);
        if (!lobby) return false;

        if (lobby.addPlayer(player)) return true;

        return false;
    }

    /**
     * Leave player from the lobby with the given id.
     */
    static leaveLobby(lobbyId: string, player: Player): boolean {
        if (!this.isLobbyExist(lobbyId)) {
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
    static deleteLobbyIfDead(lobbyId: string): void {
        const lobby = this.getLobby(lobbyId);
        if (!lobby) return;

        if (
            lobby.isBothPlayersOffline() &&
            (lobby.isGameFinished() || !lobby.isGameStarted())
        ) {
            console.log("Lobby is dead. Deleting...: ", lobbyId);
            this.lobbies.delete(lobbyId);
        }
    }
}
