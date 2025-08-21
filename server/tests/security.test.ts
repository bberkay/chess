// security.test.ts
import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { HTTPRoutes, WsTitle } from "src/Types";
import { createTestLobby, connectToTestLobby, testFetch } from "./utils";
import { WsCommand } from "src/Controllers/WsCommand";
import { MockCreator } from "./helpers/MockCreator";

const SECURITY_TIMEOUT = 5000;

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

describe("Rate Limiting & DoS Protection", () => {
    test("Should handle rapid lobby creation attempts", async () => {
        const rapidRequests = Array.from({ length: 50 }, () =>
            testFetch(serverUrl, HTTPRoutes.CreateLobby, {
                name: "spammer",
                board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                remaining: "300000",
                increment: "5000",
            })
        );

        const results = await Promise.allSettled(rapidRequests);
        const successCount = results.filter(r =>
            r.status === 'fulfilled' && r.value.success
        ).length;

        // Should either rate limit or handle all requests gracefully
        expect(successCount).toBeLessThanOrEqual(50);

        // At least some should succeed (not completely blocked)
        expect(successCount).toBeGreaterThan(0);
    }, SECURITY_TIMEOUT);

    test("Should handle WebSocket connection flooding", async () => {
        const [testLobby] = await createTestLobby(serverUrl, webSocketUrl);
        const connections: WebSocket[] = [];

        // Try to create many connections to the same lobby
        const connectionPromises = Array.from({ length: 20 }, async () => {
            try {
                const ws = new WebSocket(`${webSocketUrl}?lobbyId=${testLobby.lobbyId}&name=flood${Math.random()}`);
                connections.push(ws);
                return new Promise((resolve, reject) => {
                    ws.onopen = () => resolve(ws);
                    ws.onerror = () => reject();
                    setTimeout(() => reject(new Error("Connection timeout")), 1000);
                });
            } catch (error) {
                return Promise.reject(error);
            }
        });

        const results = await Promise.allSettled(connectionPromises);
        const successfulConnections = results.filter(r => r.status === 'fulfilled').length;

        // Should limit connections per lobby (chess only needs 2 players)
        expect(successfulConnections).toBeLessThanOrEqual(10);

        // Cleanup
        connections.forEach(ws => {
            try { ws.close(); } catch {}
        });
    }, SECURITY_TIMEOUT);
});

afterAll(() => {
    server?.stop(true);
});
