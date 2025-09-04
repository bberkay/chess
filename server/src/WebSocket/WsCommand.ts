import {
    WsIncomingMessage,
    WsOutgoingMessage,
    WsTitle
} from ".";

const ALLOWED_COMMANDS = Object.values(WsTitle).join(", ");

/**
 * This class is used to create WebSocket commands
 * to send to the client.
 */
export class WsCommand {
    /**
     * Create a WebSocket command with the given command and data.
     * @example [Moved, {from: Square.a2, to: Square.a4}]
     * @example [Resigned]
     */
    static create(wsMessage: WsOutgoingMessage): string {
        return JSON.stringify(wsMessage);
    }

    /**
     * Parse the websocket message from the client.
     * @param message "[Moved, {from: Square.a2, to: Square.a4}]"
     * @example [Moved, {from: Square.a2, to: Square.a4}]
     */
    static parse(message: string): WsIncomingMessage {
        try {
            const parsed = JSON.parse(message);

            if (!Array.isArray(parsed)) {
                throw new Error("Message must be an array in the format: [command, payload?]");
            }

            if (Object.values(WsTitle).find(parsed[0])) {
                throw new Error(`Invalid command "${parsed[0]}". Allowed commands: ${ALLOWED_COMMANDS}`);
            }

            return parsed as WsIncomingMessage;
        } catch (error: unknown) {
            throw new Error(
                "Invalid WebSocket message, the message could not be parsed: " +
                    (error instanceof Error ? error.message : ""),
            );
        }
    }
}
