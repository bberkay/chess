import { JsonNotation, StartPosition, Duration } from "@Chess/Types";
import { Lobby } from "@Lobby";
import { createRandomId } from "@Utils";
import { GU_ID_LENGTH } from "@Consts";
import { Player } from "@Player";
import { LobbyRegistryError } from ".";
import { Logger } from "@Services/Logger";

const _lobbies: Map<string, Lobby> = new Map();
const lobbyRegistryLogger = new Logger("LobbyRegistry");

/**
 * This class manages the lobbies of the game.
 */
export class LobbyRegistry {
    /**
     * Get the lobby by id.
     */
    static get(lobbyId: string): Lobby | null {
        return _lobbies.get(lobbyId) || null;
    }

    /**
     * Check if the lobby exists.
     */
    static check(lobbyId: string): boolean {
        return _lobbies.has(lobbyId);
    }

    /**
     * Create a new lobby with the given board and duration.
     */
    static create(
        board: StartPosition | JsonNotation | string,
        initialDuration: Duration
    ): string {
        const lobbyId = createRandomId(GU_ID_LENGTH, [
            ..._lobbies.keys(),
        ]);
        if (!lobbyId) throw LobbyRegistryError.factory.LobbyIdNotCreated()

        if (LobbyRegistry.check(lobbyId)) {
            LobbyRegistry.create(board, initialDuration);
        }

        _lobbies.set(
            lobbyId,
            new Lobby(lobbyId, board, initialDuration)
        );
        return lobbyId;
    }

    /**
     * Join player to the lobby with the given id.
     */
    static join(lobbyId: string, player: Player): void {
        const lobby = this.get(lobbyId);
        if (!lobby) return;
        lobby.addPlayer(player);
    }

    /**
     * Leave player from the lobby with the given id.
     */
    static leave(lobbyId: string, player: Player): void {
        const lobby = this.get(lobbyId)!
        if (!lobby) return;
        lobby.setPlayerOffline(player)
    }

    /**
     * Delete the lobby with the given id if the both players
     * are offline and the game is finished or not started.
     */
    static destroy(lobbyId: string): void {
        const lobby = this.get(lobbyId);
        if (!lobby) return;

        if (lobby.isReadyForCleanup()) {
            lobbyRegistryLogger.save("Lobby is dead. Deleting...: ", lobbyId);
            _lobbies.delete(lobbyId);
        } else {
            lobbyRegistryLogger.save(lobbyId, " lobby is not ready for cleanup.");
        }
    }

    /**
     * Checks whether the given user is currently in a lobby.
     */
    static isUserActive(player: Player) {
        return _lobbies.values().find(lobby => lobby.isPlayerInLobby(player))
    }

    /**
     * Clear the lobbies that are not active for a long time.
     * This method should be called periodically.
     */
    static clearInactives(): void {
        for (const [lobbyId, lobby] of _lobbies) {
            if (lobby.isReadyForCleanup()) {
                _lobbies.delete(lobbyId);
            }
        }
    }
}
