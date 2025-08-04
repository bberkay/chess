import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { LobbyRegistry } from "src/Lobby";
import { Color, Square } from "@Chess/Types";
import { WsDisconnectedData, WsStartedData, WsTitle } from "src/WebSocket";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { Player } from "src/Player";
import { waitForWebSocketSettle } from "./utils";

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

describe("Disconnect Lobby Tests", () => {
    test("Should mark as offline if the player disconnect while other player is connected", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby()).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });

        await creatorClient.disconnectLobby();
        await guestClient.pull(WsTitle.Disconnected);

        const testLobby = LobbyRegistry.get(lobbyId);
        if (!testLobby)
            throw new Error("Created lobby could not found");

        expect(testLobby.isPlayerInLobby(creatorClient.player)).toBe(true);
        expect(creatorClient.player.isOnline).toBe(false);

        const disconnectedPlayerColor = testLobby.getColorOfPlayer(creatorClient.player);
        if (!disconnectedPlayerColor) throw new Error("Disconnected player not found in lobby");
        const disconnectedPlayerOnServerSide: Player | null = disconnectedPlayerColor === Color.White
            ? testLobby.getWhitePlayer()
            : testLobby.getBlackPlayer()

        expect(disconnectedPlayerOnServerSide).toBeTruthy();
        expect(disconnectedPlayerOnServerSide!.isOnline).toBe(false);
    })

    test("Should send necessary data to the connected user when other one is disconnected", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby()).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });

        await guestClient.disconnectLobby();
        const disconnectedGuestData: WsDisconnectedData = await creatorClient.pull(WsTitle.Disconnected);

        const testLobby = LobbyRegistry.get(lobbyId);
        if (!testLobby) throw new Error("Created lobby could not found");
        const disconnectedPlayerColor = testLobby.getColorOfPlayer(guestClient.player);

        expect(disconnectedGuestData).toBeTruthy();
        expect(disconnectedGuestData.color).toBe(disconnectedPlayerColor);
    })

    test("Should clean up the lobby if both of the players are disconnected before the game starts", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby()).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });

        await creatorClient.disconnectLobby();
        await guestClient.disconnectLobby();

        await waitForWebSocketSettle(100);

        const testLobby = LobbyRegistry.get(lobbyId);
        expect(testLobby).toBe(null);
    })

    test("Should not clean up the lobby if both of the players are disconnected after the game starts", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby()).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });
        const startedData: WsStartedData = await guestClient.pull(WsTitle.Started);

        const whitePlayerClient = startedData.players.White.id === guestClient.player.id
            ? guestClient
            : creatorClient;
        const blackPlayerClient = startedData.players.Black.id === guestClient.player.id
            ? guestClient
            : creatorClient;

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);

        await creatorClient.disconnectLobby();
        await guestClient.disconnectLobby();

        expect(LobbyRegistry.get(lobbyId)).toBeTruthy();
    });
});

afterAll(() => {
    server?.stop(true);
});
