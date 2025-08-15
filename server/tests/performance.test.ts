import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { MockCreator } from "./helpers/MockCreator";
import { MockClient } from "./helpers/MockClient";

// TODO: Needs improving

// Performance test configuration
const PERFORMANCE_TIMEOUT = 10000; // 10 seconds for performance tests
const LOAD_TEST_ITERATIONS = 100;
const CONCURRENT_CONNECTIONS = 50;
const ACCEPTABLE_LOBBY_CREATION_TIME = 100; // milliseconds

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

describe("Performance Tests", () => {
    test("Should create lobby within acceptable time", async () => {
        const startTime = performance.now();

        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const response = await creatorClient.createLobby();

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(response.success).toBe(true);
        expect(response.data).toBeTruthy();
        expect(response.data!.lobbyId).toBeTruthy();
        expect(response.data!.player).toBeTruthy();
        expect(duration).toBeLessThan(ACCEPTABLE_LOBBY_CREATION_TIME);
    }, PERFORMANCE_TIMEOUT);

    test("Should handle concurrent lobby creations", async () => {
        const startTime = performance.now();

        const promises = Array.from({ length: CONCURRENT_CONNECTIONS }, () =>
            (new MockCreator(serverUrl, webSocketUrl)).createLobby()
        );

        const results = await Promise.all(promises);
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(results.every(r => r.success)).toBe(true);
        expect(duration).toBeLessThan(ACCEPTABLE_LOBBY_CREATION_TIME * CONCURRENT_CONNECTIONS);
        const avgTimePerRequest = duration / CONCURRENT_CONNECTIONS;
        expect(avgTimePerRequest).toBeLessThan(ACCEPTABLE_LOBBY_CREATION_TIME);
    }, PERFORMANCE_TIMEOUT);

    test("Should handle multiple WebSocket connections efficiently", async () => {
        const connections: MockClient[] = [];
        const connectPromises: Promise<void>[] = [];

        const startTime = performance.now();

        for (let i = 0; i < CONCURRENT_CONNECTIONS; i++) {
            const promise = (async () => {
                const creatorClient = new MockCreator(serverUrl, webSocketUrl);
                await creatorClient.createLobby();
                connections.push(creatorClient);
            })();
            connectPromises.push(promise);
        }

        await Promise.all(connectPromises);
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(connections.length).toBe(CONCURRENT_CONNECTIONS);
        expect(duration).toBeLessThan(ACCEPTABLE_LOBBY_CREATION_TIME * CONCURRENT_CONNECTIONS);
        connections.forEach(client => client.disconnectLobby());
    }, PERFORMANCE_TIMEOUT);

    test("Memory usage should remain stable during load", async () => {
        const initialMemory = process.memoryUsage();

        // Create and destroy many lobbies
        for (let i = 0; i < LOAD_TEST_ITERATIONS; i++) {
            const creatorClient = new MockCreator(serverUrl, webSocketUrl);
            await creatorClient.createLobby();
            creatorClient.disconnectLobby();

            // Wait a bit to allow cleanup
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }

        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cleanup

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

        // Memory should not increase significantly (less than 50MB)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }, PERFORMANCE_TIMEOUT);
});

afterAll(() => {
    server?.stop(true);
});
