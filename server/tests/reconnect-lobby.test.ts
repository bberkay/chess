import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { waitForWebSocketSettle } from "./utils";
import { WsReconnectedData, WsStartedData, WsTitle } from "src/WebSocket";
import { Color, Square } from "@Chess/Types";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { LobbyRegistry } from "@Lobby";
import { Player } from "src/Player";
import { HTTPPostBody, HTTPRoutes, HTTPRequestHandlerErrorTemplates, HTTPRequestValidatorErrorTemplates } from "@HTTP";
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

const shouldReconnect = async (hostClient: MockClient, reconnectClient: MockClient) => {
    const reconnectedLobbyResponse = await reconnectClient.reconnectLobby();
    if (!reconnectedLobbyResponse.success) {
        throw new Error(`Could not reconnect test lobby: ${reconnectedLobbyResponse.message}`);
    }

    const creatorReconnectedData: WsReconnectedData = await hostClient.pull(WsTitle.Reconnected);
    const guestReconnectedData: WsReconnectedData = await reconnectClient.pull(WsTitle.Reconnected);

    const creatorRestartedData: WsStartedData = await hostClient.pull(WsTitle.Started);
    const guestRestartedData: WsStartedData = await reconnectClient.pull(WsTitle.Started);

    const testLobby = LobbyRegistry.get(hostClient.lobbyId!);
    if (!testLobby) throw new Error("Created lobby could not found");

    expect(testLobby.isPlayerInLobby(reconnectClient.player!)).toBe(true);

    const reconnectedPlayerColor = testLobby.getColorOfPlayer(reconnectClient.player!);
    if (!reconnectedPlayerColor) throw new Error("Reconnected player not found in lobby");

    expect(creatorReconnectedData).toBeTruthy();
    expect(guestReconnectedData).toBeTruthy();
    expect(creatorReconnectedData).toEqual(guestReconnectedData);
    expect(creatorReconnectedData.color).toBe(reconnectedPlayerColor);

    const reconnectedPlayerOnServerSide: Player | null = reconnectedPlayerColor === Color.White
        ? testLobby.getWhitePlayer()
        : testLobby.getBlackPlayer()

    expect(reconnectedPlayerOnServerSide).toBeTruthy();
    expect(reconnectedPlayerOnServerSide!.isOnline).toBe(true);

    expect(creatorRestartedData).toBeTruthy();
    expect(guestRestartedData).toBeTruthy();
    expect(creatorRestartedData).toEqual(guestRestartedData);
}

const shouldNotReconnect = async (reconnectClient: MockClient, errMsg?: string) => {
    const reconnectedLobbyResponse = await reconnectClient!.reconnectLobby();
    expect(reconnectedLobbyResponse.success).toBe(false);
    if (errMsg) expect(reconnectedLobbyResponse.message).toBe(errMsg);

    // Lobby might be deleted by LobbyRegistry if both of the player's are disconnected
    // and game hasn't started so if lobby is deleted don't continue to check
    // disconnected player's online status.
    const testLobby = LobbyRegistry.get(reconnectClient.lobbyId!);
    if (!testLobby) {
        console.log("Created lobby could not found");
        return;
    }

    expect(testLobby.isPlayerInLobby(reconnectClient!.player!)).toBe(true);

    const reconnectedPlayerColor = testLobby.getColorOfPlayer(reconnectClient!.player!);
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
        await shouldNotReconnect(anotherCreator, HTTPRequestHandlerErrorTemplates.PlayerNotInLobby(creatorClient.lobbyId!, anotherCreator.player!.token));
    })

    test("Should not be able to reconnect if hasn't disconnected yet", async () => {
        const creatorClient = await createTestLobby();
        const guestClient = await connectTestLobby(creatorClient.lobbyId!);
        await shouldNotReconnect(guestClient, HTTPRequestHandlerErrorTemplates.PlayerAlreadyOnline(creatorClient.lobbyId!, guestClient.player!.token));
    })

    test("Should not be able to reconnect with invalid token", async () => {
        const creatorClient = await createTestLobby();
        const guestClient = await connectTestLobby(creatorClient.lobbyId!);
        await guestClient.disconnectLobby();
        guestClient.player!.token = "000001";
        await shouldNotReconnect(guestClient, HTTPRequestHandlerErrorTemplates.PlayerNotFound(guestClient.player!.token));
    })

    test("Should not reconnect to lobby on injection attempts in lobby id", async () => {
        for (const payload of INJECTION_PAYLOADS) {
            const creatorClient = await createTestLobby();
            const guestClient = await connectTestLobby(creatorClient.lobbyId!);
            await guestClient.disconnectLobby();
            guestClient.lobbyId = payload;
            await shouldNotReconnect(guestClient, HTTPRequestValidatorErrorTemplates.InvalidLobbyId());
        }
    });

    test("Should not reconnect to lobby on injection attempts in player token", async () => {
        for (const payload of INJECTION_PAYLOADS) {
            const creatorClient = await createTestLobby();
            const guestClient = await connectTestLobby(creatorClient.lobbyId!);
            await guestClient.disconnectLobby();
            guestClient.player!.token = payload;
            await shouldNotReconnect(guestClient, HTTPRequestValidatorErrorTemplates.InvalidPlayerToken());
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

        await shouldReconnect(creatorClient, guestClient);
        await shouldReconnect(guestClient, creatorClient);
    })
});

afterAll(() => {
    server?.stop(true);
});
