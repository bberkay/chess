import { RWebSocket } from "../Types";

/**
 * This class manages the sockets.
 */
export class SocketManager{
    private static sockets: Map<string, {
        [userToken: string]: RWebSocket;
    }> = new Map();

    /**
     * Add a new socket to the manager.
     */
    static addSocket(lobbyId: string, userToken:string, socket: RWebSocket): void
    {
        this.sockets.set(lobbyId, {
            ...this.sockets.get(lobbyId),
            [userToken]: socket
        });
    }

    /**
     * Get the socket of the user.
     */
    static getSocket(lobbyId: string, userToken: string): RWebSocket | null
    {
        return this.sockets.get(lobbyId)?.[userToken] || null;
    }

    /**
     * Remove the socket from the manager.
     */
    static removeSocket(lobbyId: string, userToken: string): void
    {
        if(this.sockets.has(lobbyId))
            delete this.sockets.get(lobbyId)![userToken];
    }
}