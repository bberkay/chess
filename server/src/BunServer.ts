/**
 * @module BunServer
 * @description Sets up and starts the Bun HTTP and WebSocket server with custom routing,
 * request handling, and error management for the chess platform backend.
 * @author Berkay Kaya <berkaykayaforbusiness@gmail.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess
 * @license MIT
 */

import type { Server } from "bun";
import {
    AvailableHTTPRequests,
    HTTPRequestHandler,
    CORSResponse,
} from "./HTTP";
import { WebSocketHandler, WebSocketData } from "./WebSocket";

export function createServer(): Server {
    const httpRequestHandler = new HTTPRequestHandler();
    const webSocketHandler = new WebSocketHandler();
    const server = Bun.serve<WebSocketData, AvailableHTTPRequests>({
        port: Bun.env.SERVER_PORT,
        // avaiable routes
        routes: httpRequestHandler.expose(),
        // fallback for unmatched routes
        fetch(req: Request, server: Server) {
            if (
                httpRequestHandler.canHandle(req) &&
                !webSocketHandler.canHandle(req)
            ) {
                return new CORSResponse(
                    {
                        success: false,
                        message: "Request path could not found.",
                    },
                    { status: 404 },
                );
            }

            const wsData = webSocketHandler.createWsData(req);
            console.log("ws data created: ");
            if (wsData instanceof CORSResponse) return wsData;

            // upgrade the connection.
            const success = server.upgrade(req, {
                data: wsData,
            });
            if (success) {
                webSocketHandler.upgradeServer(server);
                return;
            }

            return undefined;
        },
        websocket: {
            ...webSocketHandler.expose(),
            maxPayloadLength: Number(Bun.env.MAX_PAYLOAD_LENGTH),
            idleTimeout: Number(Bun.env.MAX_IDLE_TIMEOUT),
        },
        error(error) {
            console.error(error);
            return new CORSResponse(
                {
                    success: false,
                    message: `Internal Error: ${error.message}`,
                },
                {
                    status: 500,
                    headers: {
                        "Content-Type": "text/plain",
                    },
                },
            );
        },
    });

    console.log(`Listening on http://localhost:${server.port} ...`);
    return server;
}
