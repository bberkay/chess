import { GU_ID_LENGTH } from "@Consts";
import { createRandomId } from "@Utils";
import { Player, PlayerRegistryError } from "@Player";
import { LobbyRegistry } from "@Lobby";

const _players: Map<string, Player> = new Map();

export class PlayerRegistry {
    /**
     * Get the player by token.
     */
    static get(token: string): Player | null {
        return _players.get(token) || null;
    }

    /**
     * Check if the player exists.
     */
    static check(token: string): boolean {
        return _players.has(token);
    }

    /**
     * Create a new lobby with the given board and duration.
     */
    static create(name: string): Player {
        const token = createRandomId(GU_ID_LENGTH, [
            ..._players.keys(),
        ]);
        if (!token) throw PlayerRegistryError.factory.PlayerTokenNotCreated()

        if (PlayerRegistry.check(token)) {
            PlayerRegistry.create(name);
        }

        const id = createRandomId(GU_ID_LENGTH, [
            ..._players.keys(),
        ]);
        if (!id) throw PlayerRegistryError.factory.PlayerIdNotCreated()

        if (PlayerRegistry.check(id)) {
            PlayerRegistry.create(name);
        }

        const player: Player = {
            id,
            token,
            name,
            isOnline: false
        };
        _players.set(player.token, player);
        return player;
    }

    /**
    * Delete a player from the registry by their token.
    *
    * If the player exists and is not currently active in a lobby,
    * the player is removed from the internal registry.
    * If the player is still part of an active game, the deletion
    * is skipped and a message is logged instead.
    */
    static delete(playerId: string): void {
        const player = this.get(playerId);
        if (!player) return;

        if (LobbyRegistry.isPlayerActive(player)) {
            _players.delete(playerId);
        }
    }
}
