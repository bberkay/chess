import { GU_ID_LENGTH } from "@Consts";
import { createRandomId } from "@Utils";
import { Player } from "src/Player";
import { LobbyRegistry } from "src/Lobby";
import { PlayerRegistryError } from ".";
import { Logger } from "src/Services/Logger";

const _players: Map<string, Player> = new Map();
const playerRegistryLogger = new Logger("PlayerRegistry");

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

    static delete(userId: string): void {
        const user = this.get(userId);
        if (!user) return;

        if (!LobbyRegistry.isUserActive(user)) {
            playerRegistryLogger.save("Player in still in online game, could not deleted player with user id ", userId);
        } else {
            playerRegistryLogger.save("Player is inactive. Deleting...: ", userId);
            _players.delete(userId);
        }
    }
}
