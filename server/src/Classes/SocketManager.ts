import { RWebSocket } from "../Types";

/**
 * This class manages the sockets.
 */
export class SocketManager {
    private static sockets: Map<
        string,
        {
            [token: string]: RWebSocket;
        }
    > = new Map();

    /**
     * Add a new socket to the manager.
     */
    static addSocket(lobbyId: string, token: string, socket: RWebSocket): void {
        this.sockets.set(lobbyId, {
            ...this.sockets.get(lobbyId),
            [token]: socket,
        });
    }

    /**
     * Get the socket of the user.
     */
    static getSocket(lobbyId: string, token: string): RWebSocket | null {
        return this.sockets.get(lobbyId)?.[token] || null;
    }

    /**
     * Remove the socket from the manager.
     */
    static removeSocket(lobbyId: string, token: string): void {
        if (this.sockets.has(lobbyId)) delete this.sockets.get(lobbyId)![token];
    }
}
