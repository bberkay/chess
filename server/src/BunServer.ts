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
    HTTPServerScheme,
    HTTPRequestHandler,
    CORSResponse,
} from "@HTTP";
import { WebSocketHandler, WebSocketData } from "@WebSocket";

/**
 * Creates and starts a Bun HTTP and WebSocket server configured for the chess platform backend.
 *
 * This function sets up:
 * - HTTP request handling with custom routing and CORS support.
 * - WebSocket upgrade handling and event management for real-time communication.
 * - Fallback handling for unmatched HTTP requests.
 * - Error handling with standardized CORS error responses.
 *
 * The server configuration uses environment variables for port, maximum payload length,
 * and idle timeout settings.
 *
 * Usage:
 * ```ts
 * const server = createServer();
 * ```
 *
 * @returns The running Bun `Server` instance.
 */
export function createServer(): Server {
    const httpRequestHandler = new HTTPRequestHandler();
    const webSocketHandler = new WebSocketHandler();
    // TODO: Fix this, bu test proje de oluyordu burada olmuyor nedense
    const server = Bun.serve<WebSocketData, HTTPServerScheme>({
        port: Bun.env.SERVER_PORT,
        // avaiable routes
        routes: httpRequestHandler.expose(() => server),
        // fallback for unmatched routes
        fetch(req: Request, server: Server) {
            // TODO: Olmuyor, tüm sistemi değiştirmek lazım onu yapmayalım. Ama bir şekilde de yapamayız
            // bir şekilde server a erişebilmeliyiz route dan, öyle ya da böyle, ayrı bir proje de test
            // edilebilir belki.
            // Server değişkenin tanımlandığı yer belli sonuçta yukarıda satır 40 da const ile, onu başka bir yere
            // taşımak mantıklı değil.
            // Acaba bunu yapabilecek miyiz?
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
            if (wsData instanceof CORSResponse) {
                return wsData;
            }

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

    console.log(`Listening on http://${server.hostname}:${server.port} ...`);
    return server;
}
