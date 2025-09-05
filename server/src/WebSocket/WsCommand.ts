import {
    WebSocketValidatorError,
    WsIncomingMessage,
    WsOutgoingMessage,
    WsTitle
} from ".";
import { assertNoMaliciousContent } from "./utils";
import { WsCommandError } from "./WsCommandError";

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
            const parsed: WsIncomingMessage = JSON.parse(message);

            if (!Array.isArray(parsed) || typeof parsed[0] !== "string") {
                throw WsCommandError.factory.InvalidFormat();
            }

            if (!Object.values(WsTitle).find((title) => title === parsed[0])) {
                throw WsCommandError.factory.InvalidCommand();
            }

            assertNoMaliciousContent(parsed[1]);

            return parsed;
        } catch (e: unknown) {
            if (e instanceof WsCommandError || e instanceof WebSocketValidatorError) {
                throw e;
            } else {
                throw WsCommandError.factory.UnexpectedErrorWhileParsingWsCommand();
            }
        }
    }
}
