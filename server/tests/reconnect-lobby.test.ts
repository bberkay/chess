import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe, beforeEach } from "vitest";
import { type Server } from "bun";
import { waitForWebSocketSettle } from "./utils";
import { pruneIPMessages, WsReconnectedData, WsStartedData, WsTitle } from "@WebSocket";
import { Color, Square } from "@Chess/Types";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { LobbyRegistry } from "@Lobby";
import { Player } from "src/Player";
import { HTTPPostBody, HTTPRoutes, HTTPRequestHandlerErrorTemplates, HTTPRequestValidatorErrorTemplates, pruneIPRequests } from "@HTTP";
import { INJECTION_PAYLOADS, TEST_BOARD } from "./consts";
import { MockClient } from "./helpers/MockClient";

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

beforeEach(async () => {
    pruneIPRequests(true);
    pruneIPMessages(true);
});

const createTestLobby = async (body: HTTPPostBody[HTTPRoutes.CreateLobby] | null = null) => {
    body = body ?? { name: "alex", ...TEST_BOARD }
    const creatorClient = new MockCreator(serverUrl, webSocketUrl);
    const createdLobbyResponse = await creatorClient.createLobby(body)
    if (!createdLobbyResponse.success) {
        throw new Error(`Could not create test lobby: ${createdLobbyResponse.message}`);
    }
    return creatorClient;
};

const connectTestLobby = async (lobbyId: string) => {
    const guestClient = new MockGuest(serverUrl, webSocketUrl);
    const connectedLobbyResponse = await guestClient.connectLobby({ name: "terry", lobbyId });
    if (!connectedLobbyResponse.success) {
        throw new Error(`Could not connect test lobby: ${connectedLobbyResponse.message}`);
    }
    await guestClient.pull(WsTitle.Connected);
    return guestClient;
}

const shouldReconnect = async (alreadyConnectedClient: MockClient, reconnectClient: MockClient, checkIsOnline: boolean = true) => {
    const reconnectedLobbyResponse = await reconnectClient.reconnectLobby();
    if (!reconnectedLobbyResponse.success) {
        throw new Error(`Could not reconnect test lobby: ${reconnectedLobbyResponse.message}`);
    }

    const reconnectedData: WsReconnectedData = await alreadyConnectedClient.pull(WsTitle.Reconnected);

    const creatorRestartedData: WsStartedData = await alreadyConnectedClient.pull(WsTitle.Started);
    const guestRestartedData: WsStartedData = await reconnectClient.pull(WsTitle.Started);

    expect(creatorRestartedData).toBeTruthy();
    expect(guestRestartedData).toBeTruthy();
    // Remove durations from game since they cannot be same
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { durations: creatorDurations, ...creatorRestartedGame } = creatorRestartedData.game;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { durations: guestDurations, ...guestRestartedGame } = guestRestartedData.game;
    expect(creatorRestartedGame).toEqual(guestRestartedGame);

    const testLobby = LobbyRegistry.get(reconnectClient.lobbyId!);
    if (!testLobby) throw new Error("Created lobby could not found");
    expect(testLobby.isPlayerInLobby(reconnectClient.player!)).toBe(true);

    // Color shouldn't be change after reconnection.
    const reconnectedPlayerColor = testLobby.getColorOfPlayer(reconnectClient.player!);
    if (!reconnectedPlayerColor) throw new Error("Reconnected player not found in lobby");
    expect(reconnectedData.color).toBe(reconnectedPlayerColor);

    if (checkIsOnline) shouldBeOnline(reconnectClient);
}

const shouldNotReconnect = async (reconnectClient: MockClient, errMsg?: string, checkIsOffline: boolean = true) => {
    const reconnectedLobbyResponse = await reconnectClient!.reconnectLobby(false);
    expect(reconnectedLobbyResponse.success).toBe(false);
    if (errMsg) expect(reconnectedLobbyResponse.message).toBe(errMsg);
    if (checkIsOffline) shouldBeOffline(reconnectClient);
}

const shouldBeOnline = (reconnectedClient: MockClient) => {
    const testLobby = LobbyRegistry.get(reconnectedClient.lobbyId!);
    if (!testLobby) throw new Error("Created lobby could not found");

    const blackPlayer = testLobby.getBlackPlayer()!;
    const reconnectedPlayerOnServerSide: Player | null = blackPlayer.id === reconnectedClient.player!.id
        ? blackPlayer
        : testLobby.getWhitePlayer();

    expect(reconnectedPlayerOnServerSide).toBeTruthy();
    expect(reconnectedPlayerOnServerSide!.isOnline).toBe(true);
}

const shouldBeOffline = (disconnectedClient: MockClient) => {
    // Lobby might be deleted by LobbyRegistry if both of the player's are disconnected
    // and game hasn't started so if lobby is deleted don't continue to check
    // disconnected player's online status.
    const testLobby = LobbyRegistry.get(disconnectedClient.lobbyId!);
    if (!testLobby) {
        console.log("Created lobby could not found");
        return;
    }

    expect(testLobby.isPlayerInLobby(disconnectedClient!.player!)).toBe(true);

    const reconnectedPlayerColor = testLobby.getColorOfPlayer(disconnectedClient!.player!);
    if (!reconnectedPlayerColor) throw new Error("Reconnected player not found in lobby");
    const reconnectedPlayerOnServerSide: Player | null = reconnectedPlayerColor === Color.White
        ? testLobby.getWhitePlayer()
        : testLobby.getBlackPlayer()

    expect(reconnectedPlayerOnServerSide).toBeTruthy();
    expect(reconnectedPlayerOnServerSide!.isOnline).toBe(false);
}

describe("Reconnect Lobby Tests", () => {
    test("Should be able to receive necessary data after reconnected", async () => {
        const creatorClient = await createTestLobby();
        const guestClient = await connectTestLobby(creatorClient.lobbyId!);
        await guestClient.disconnectLobby();

        await shouldReconnect(creatorClient, guestClient);
    })

    test("Should not be able to reconnect if hasn't connected yet", async () => {
        const creatorClient = await createTestLobby();
        const anotherCreator = await createTestLobby();
        anotherCreator.lobbyId = creatorClient.lobbyId;
        await shouldNotReconnect(anotherCreator, HTTPRequestHandlerErrorTemplates.PlayerNotInLobby(creatorClient.lobbyId!, anotherCreator.player!.token), false);
    })

    test("Should not be able to reconnect if hasn't disconnected yet", async () => {
        const creatorClient = await createTestLobby();
        const guestClient = await connectTestLobby(creatorClient.lobbyId!);
        await shouldNotReconnect(guestClient, HTTPRequestHandlerErrorTemplates.PlayerAlreadyOnline(creatorClient.lobbyId!, guestClient.player!.token), false);
        shouldBeOnline(guestClient);
    })

    test("Should not be able to reconnect with invalid token", async () => {
        const creatorClient = await createTestLobby();
        const guestClient = await connectTestLobby(creatorClient.lobbyId!);
        await guestClient.disconnectLobby();
        const originalToken = guestClient.player!.token;
        guestClient.player!.token = "000001";
        await shouldNotReconnect(guestClient, HTTPRequestHandlerErrorTemplates.PlayerNotFound(guestClient.player!.token), false);
        guestClient.player!.token = originalToken;
        shouldBeOffline(guestClient);
    })

    test("Should not reconnect to lobby on injection attempts in lobby id", async () => {
        for (const payload of INJECTION_PAYLOADS) {
            const creatorClient = await createTestLobby();
            const guestClient = await connectTestLobby(creatorClient.lobbyId!);
            await guestClient.disconnectLobby();
            guestClient.lobbyId = payload;
            await shouldNotReconnect(guestClient, HTTPRequestValidatorErrorTemplates.InvalidPayload());
        }
    });

    test("Should not reconnect to lobby on injection attempts in player token", async () => {
        for (const payload of INJECTION_PAYLOADS) {
            const creatorClient = await createTestLobby();
            const guestClient = await connectTestLobby(creatorClient.lobbyId!);
            await guestClient.disconnectLobby();
            const originalToken = guestClient.player!.token;
            guestClient.player!.token = payload;
            await shouldNotReconnect(guestClient, HTTPRequestValidatorErrorTemplates.InvalidPayload(), false);
            guestClient.player!.token = originalToken;
            shouldBeOffline(guestClient);
        }
    });

    test("Should not be able to reconnect after disconnected from the game if the game hasn't started yet and there is no online player in the lobby", async () => {
        const creatorClient = await createTestLobby();
        const guestClient = await connectTestLobby(creatorClient.lobbyId!);

        await creatorClient.disconnectLobby();
        await guestClient.disconnectLobby();

        // Wait LobbyRegistry to delete inactive lobby
        await waitForWebSocketSettle(100);

        const testLobby = LobbyRegistry.get(creatorClient.lobbyId!);
        expect(testLobby).toBe(null);

        await shouldNotReconnect(guestClient, HTTPRequestHandlerErrorTemplates.LobbyNotFound(creatorClient.lobbyId!));
        await shouldNotReconnect(guestClient, HTTPRequestHandlerErrorTemplates.LobbyNotFound(creatorClient.lobbyId!));
    })

    test("Should be able to reconnect after disconnected from the game if the game has started, even there is no online player in the lobby", async () => {
        const creatorClient = await createTestLobby();
        const guestClient = await connectTestLobby(creatorClient.lobbyId!);

        await creatorClient.pull(WsTitle.Started);
        const guestStartedData = await guestClient.pull(WsTitle.Started);

        const whitePlayerClient = guestStartedData!.players.White.id === guestClient!.player!.id
            ? guestClient!
            : creatorClient!;
        const blackPlayerClient = guestStartedData!.players.Black.id === guestClient!.player!.id
            ? guestClient!
            : creatorClient!;

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);

        await creatorClient!.disconnectLobby();
        await guestClient!.disconnectLobby();

        // Since some moves are played, the lobby should
        // not be deleted by LobbyRegistry.
        await waitForWebSocketSettle(100);

        const reconnectedCreatorLobbyResponse = await creatorClient.reconnectLobby();
        if (!reconnectedCreatorLobbyResponse.success) {
            throw new Error(`Creator could not reconnect test lobby: ${reconnectedCreatorLobbyResponse.message}`);
        }

        const creatorRestartedData: WsStartedData = await creatorClient.pull(WsTitle.Started);
        expect(creatorRestartedData).toBeTruthy();

        const reconnectedGuestLobbyResponse = await guestClient.reconnectLobby();
        if (!reconnectedGuestLobbyResponse.success) {
            throw new Error(`Guest could not reconnect test lobby: ${reconnectedGuestLobbyResponse.message}`);
        }

        const reconnectedGuestData: WsReconnectedData = await creatorClient.pull(WsTitle.Reconnected);

        const guestRestartedData: WsStartedData = await guestClient.pull(WsTitle.Started);
        expect(guestRestartedData).toBeTruthy();

        const testLobby = LobbyRegistry.get(creatorClient.lobbyId!);
        if (!testLobby) throw new Error("Created lobby could not found");

        expect(testLobby.isPlayerInLobby(creatorClient.player!)).toBe(true);
        expect(testLobby.isPlayerInLobby(guestClient.player!)).toBe(true);

        // Color shouldn't be change after reconnection.
        const reconnectedCreatorColor = testLobby.getColorOfPlayer(creatorClient.player!);
        if (!reconnectedCreatorColor) throw new Error("Reconnected player not found in lobby");
        expect(reconnectedGuestData.color === Color.White ? Color.Black : Color.White).toBe(reconnectedCreatorColor);

        const reconnectedGuestPlayerColor = testLobby.getColorOfPlayer(guestClient.player!);
        if (!reconnectedGuestPlayerColor) throw new Error("Reconnected player not found in lobby");
        expect(reconnectedGuestData.color).toBe(reconnectedGuestPlayerColor);

        shouldBeOnline(creatorClient);
        shouldBeOnline(guestClient);
    })
});

afterAll(() => {
    server?.stop(true);
});
