import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { waitForWebSocketSettle } from "./utils";
import { WsConnectedData, WsReconnectedData, WsStartedData, WsTitle } from "src/WebSocket";
import { Color, Square } from "@Chess/Types";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { LobbyRegistry } from "@Lobby";
import { Player } from "src/Player";

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

describe("Reconnect Lobby Tests", () => {
    test("Should be able to reconnect after disconnected from the game if there is an online player in the lobby", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby()).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });

        await guestClient.disconnectLobby();
        await creatorClient.pull(WsTitle.Disconnected);

        await guestClient.reconnectLobby({ lobbyId, playerToken: guestClient.player.token });
        await creatorClient.pull(WsTitle.Reconnected);

        const testLobby = LobbyRegistry.get(lobbyId);
        if (!testLobby) throw new Error("Created lobby could not found");

        expect(testLobby.isPlayerInLobby(guestClient.player)).toBe(true);

        const reconnectedPlayerColor = testLobby.getColorOfPlayer(guestClient.player);
        if (!reconnectedPlayerColor) throw new Error("Reconnected player not found in lobby");
        const reconnectedPlayerOnServerSide: Player | null = reconnectedPlayerColor === Color.White
            ? testLobby.getWhitePlayer()
            : testLobby.getBlackPlayer()

        expect(reconnectedPlayerOnServerSide).toBeTruthy();
        expect(reconnectedPlayerOnServerSide!.isOnline).toBe(true);
    })

    test("Should send necessary data to the connected user when other one is reconnected", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby()).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });

        await guestClient.disconnectLobby();
        await creatorClient.pull(WsTitle.Disconnected);

        await guestClient.reconnectLobby({ lobbyId, playerToken: guestClient.player.token });
        const creatorReconnedData: WsReconnectedData = await creatorClient.pull(WsTitle.Reconnected);

        const testLobby = LobbyRegistry.get(lobbyId);
        if (!testLobby) throw new Error("Created lobby could not found");

        const reconnectedPlayerColor = testLobby.getColorOfPlayer(guestClient.player);
        if (!reconnectedPlayerColor) throw new Error("Reconnected player not found in lobby");

        expect(creatorReconnedData).toBeTruthy();
        expect(creatorReconnedData.color).toBe(reconnectedPlayerColor);
    })

    test("Should be able to receive necessary data after reconnected", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby()).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });
        const guestFirstConnectedData: WsConnectedData = await guestClient.pull(WsTitle.Connected);
        const guestFirstStartedData: WsStartedData = await guestClient.pull(WsTitle.Started);

        await guestClient.disconnectLobby();
        await creatorClient.pull(WsTitle.Disconnected);

        await guestClient.reconnectLobby({ lobbyId, playerToken: guestClient.player.token });
        await creatorClient.pull(WsTitle.Reconnected);
        const guestSecondConnectedData: WsConnectedData = await guestClient.pull(WsTitle.Connected);
        const guestSecondStartedData: WsStartedData = await guestClient.pull(WsTitle.Started);

        const testLobby = LobbyRegistry.get(lobbyId);
        if (!testLobby) throw new Error("Created lobby could not found");

        expect(guestSecondConnectedData).toEqual(guestFirstConnectedData);
        expect(guestSecondStartedData).toEqual(guestFirstStartedData);
    })

    test("Should not be able to reconnect after disconnected from the game if the game hasn't started yet and there is no online player in the lobby", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby()).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });

        await creatorClient.disconnectLobby();
        await guestClient.disconnectLobby();

        await waitForWebSocketSettle(100);

        const testLobby = LobbyRegistry.get(lobbyId);
        expect(testLobby).toBe(null);

        await expect(
            creatorClient.reconnectLobby({
                lobbyId,
                playerToken: creatorClient.player.token
            })
        ).rejects.toThrow("Could not reconnect lobby");

        await expect(
            guestClient.reconnectLobby({
                lobbyId,
                playerToken: guestClient.player.token
            })
        ).rejects.toThrow("Could not reconnect lobby");
    })

    test("Should be able to reconnect after disconnected from the game if the game has started, even there is no online player in the lobby", async () => {
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

        await waitForWebSocketSettle(100);

        const testLobby = LobbyRegistry.get(lobbyId);
        expect(testLobby).toBeTruthy();

        expect(creatorClient.player.isOnline).toBe(false);
        expect(guestClient.player.isOnline).toBe(false);

        await creatorClient.reconnectLobby({
            lobbyId,
            playerToken: creatorClient.player.token
        });
        await guestClient.reconnectLobby({
            lobbyId,
            playerToken: guestClient.player.token
        })
        const creatorStartedData: WsStartedData = await guestClient.pull(WsTitle.Started);
        const guestStartedData: WsStartedData = await guestClient.pull(WsTitle.Started);

        expect(creatorClient.player.isOnline).toBe(true);
        expect(guestClient.player.isOnline).toBe(true);
        expect(creatorStartedData).toBeTruthy();
        expect(guestStartedData).toBeTruthy();
        expect(creatorStartedData).toEqual(guestStartedData);
    })
});

afterAll(() => {
    server?.stop(true);
});
