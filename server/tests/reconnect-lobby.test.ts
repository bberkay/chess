import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { createLocalBoard, waitForWebSocketSettle } from "./utils";
import { WsConnectedData, WsReconnectedData, WsStartedData, WsTitle } from "src/WebSocket";
import { Color, Square } from "@Chess/Types";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { LobbyRegistry } from "@Lobby";
import { Player } from "src/Player";
import { HTTPPostBody, HTTPPostRoutes, HTTPRequestHandlerErrorTemplates, HTTPRequestValidatorErrorTemplates } from "@HTTP";
import { INJECTION_PAYLOADS, TEST_BOARD } from "./consts";

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

let testLobbyId: string | null = null;

let creatorClient: MockCreator | null = null;
let creatorConnectedData: WsConnectedData | null = null;
let creatorStartedData: WsStartedData | null = null;

let guestClient: MockGuest | null = null;
let guestConnectedData: WsConnectedData | null = null;
let guestStartedData: WsStartedData | null = null;

// TODO: Convert this local
const initTestLobby = async () => {
    creatorClient = new MockCreator(serverUrl, webSocketUrl);
    const createdLobbyResponse = await creatorClient.createLobby({ name: "alex", ...TEST_BOARD })
    if (!createdLobbyResponse.success) {
        throw new Error(`Could not create test lobby: ${createdLobbyResponse.message}`);
    }

    testLobbyId = createdLobbyResponse.data!.lobbyId;
    creatorConnectedData = await creatorClient.pull(WsTitle.Connected);

    guestClient = new MockGuest(serverUrl, webSocketUrl);
    const connectedLobbyResponse = await guestClient.connectLobby({ name: "terry", lobbyId: testLobbyId });
    if (!connectedLobbyResponse.success) {
        throw new Error(`Could not connect test lobby: ${connectedLobbyResponse.message}`);
    }

    guestConnectedData = await guestClient.pull(WsTitle.Connected);

    creatorStartedData = await creatorClient.pull(WsTitle.Started);
    guestStartedData = await guestClient.pull(WsTitle.Started);

    await guestClient.disconnectLobby();
    await creatorClient.pull(WsTitle.Disconnected);
};

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
    await initTestLobby();
});

const shouldReconnect = async (body: HTTPPostBody[HTTPPostRoutes.ReconnectLobby]) => {
    if ([creatorClient, creatorConnectedData, creatorStartedData, guestClient, guestConnectedData, guestStartedData].includes(null))
        throw new Error("Can't connect because test lobby is not created.");

    const reconnectedLobbyResponse = await guestClient!.reconnectLobby(body);
    if (!reconnectedLobbyResponse.success) {
        throw new Error(`Could not reconnect test lobby: ${reconnectedLobbyResponse.message}`);
    }

    const creatorReconnectedData: WsReconnectedData = await creatorClient!.pull(WsTitle.Reconnected);
    const guestReconnectedData: WsReconnectedData = await guestClient!.pull(WsTitle.Reconnected);

    const creatorRestartedData: WsStartedData = await creatorClient!.pull(WsTitle.Started);
    const guestRestartedData: WsStartedData = await guestClient!.pull(WsTitle.Started);

    const testLobby = LobbyRegistry.get(body.lobbyId);
    if (!testLobby) throw new Error("Created lobby could not found");

    expect(testLobby.isPlayerInLobby(guestClient!.player)).toBe(true);

    const reconnectedPlayerColor = testLobby.getColorOfPlayer(guestClient!.player);
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
    expect(creatorStartedData!.game).toEqual(guestStartedData!.game);
    expect(creatorStartedData!.game).toEqual(createLocalBoard(TEST_BOARD));
}

const shouldNotReconnect = async (body: HTTPPostBody[HTTPPostRoutes.ReconnectLobby], errMsg?: string) => {
    if ([creatorClient, creatorConnectedData, creatorStartedData, guestClient, guestConnectedData, guestStartedData].includes(null))
        throw new Error("Can't connect because test lobby is not created.");

    const reconnectedLobbyResponse = await guestClient!.reconnectLobby(body);
    expect(reconnectedLobbyResponse.success).toBe(false);
    if (errMsg) expect(reconnectedLobbyResponse.message).toBe(errMsg);
}

describe("Reconnect Lobby Tests", () => {
    test("Should be able to receive necessary data after reconnected", async () => {
        await shouldReconnect({
            lobbyId: testLobbyId!,
            playerToken: guestClient!.player.token
        });
    })

    test("Should not be able to reconnect with invalid token", async () => {
        const invalidPlayerToken = "000001";
        await shouldNotReconnect({
            lobbyId: testLobbyId!,
            playerToken: invalidPlayerToken
        }, HTTPRequestHandlerErrorTemplates.PlayerNotFound(invalidPlayerToken));

        const testLobby = LobbyRegistry.get(testLobbyId!);
        if (!testLobby) throw new Error("Created lobby could not found");

        expect(testLobby.isPlayerInLobby(guestClient!.player)).toBe(true);

        const reconnectedPlayerColor = testLobby.getColorOfPlayer(guestClient!.player);
        if (!reconnectedPlayerColor) throw new Error("Reconnected player not found in lobby");
        const reconnectedPlayerOnServerSide: Player | null = reconnectedPlayerColor === Color.White
            ? testLobby.getWhitePlayer()
            : testLobby.getBlackPlayer()

        expect(reconnectedPlayerOnServerSide).toBeTruthy();
        expect(reconnectedPlayerOnServerSide!.isOnline).toBe(false);
    })

    test("Should not be able to reconnect if hasn't connected and disconnected before", async () => {
        const invalidPlayerToken = "000001";
        await shouldNotReconnect({
            lobbyId: testLobbyId!,
            playerToken: invalidPlayerToken
        }, HTTPRequestHandlerErrorTemplates.PlayerNotFound(invalidPlayerToken));

        const testLobby = LobbyRegistry.get(testLobbyId);
        if (!testLobby) throw new Error("Created lobby could not found");

        expect(testLobby.isPlayerInLobby(guestClient.player)).toBe(true);

        const reconnectedPlayerColor = testLobby.getColorOfPlayer(guestClient.player);
        if (!reconnectedPlayerColor) throw new Error("Reconnected player not found in lobby");
        const reconnectedPlayerOnServerSide: Player | null = reconnectedPlayerColor === Color.White
            ? testLobby.getWhitePlayer()
            : testLobby.getBlackPlayer()

        expect(reconnectedPlayerOnServerSide).toBeTruthy();
        expect(reconnectedPlayerOnServerSide!.isOnline).toBe(false);
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
        if ([creatorClient, creatorConnectedData, creatorStartedData, guestClient, guestConnectedData, guestStartedData].includes(null))
            throw new Error("Can't connect because test lobby is not created.");

        const whitePlayerClient = guestStartedData!.players.White.id === guestClient!.player.id
            ? guestClient!
            : creatorClient!;
        const blackPlayerClient = guestStartedData!.players.Black.id === guestClient!.player.id
            ? guestClient!
            : creatorClient!;

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);

        await creatorClient!.disconnectLobby();
        await guestClient!.disconnectLobby();

        await waitForWebSocketSettle(100);

        const testLobby = LobbyRegistry.get(testLobbyId!);
        expect(testLobby).toBeTruthy();

        expect(creatorClient!.player.isOnline).toBe(false);
        expect(guestClient!.player.isOnline).toBe(false);

        const creatorReconnectedLobbyResponse = await creatorClient!.reconnectLobby({
            lobbyId: testLobbyId!,
            playerToken: creatorClient!.player.token
        });
        if (!creatorReconnectedLobbyResponse.success) {
            throw new Error(`Creator could not reconnect: ${creatorReconnectedLobbyResponse.message}`)
        }

        const guestReconnectedLobbyResponse = await guestClient!.reconnectLobby({
            lobbyId: testLobbyId!,
            playerToken: guestClient!.player.token
        })
        if (!guestReconnectedLobbyResponse.success) {
            throw new Error(`Guest could not reconnect: ${guestReconnectedLobbyResponse.message}`)
        }

        expect(creatorClient!.player.isOnline).toBe(true);
        expect(guestClient!.player.isOnline).toBe(true);

        const creatorRestartedData: WsStartedData = await creatorClient!.pull(WsTitle.Started);
        const guestRestartedData: WsStartedData = await guestClient!.pull(WsTitle.Started);

        expect(creatorRestartedData).toBeTruthy();
        expect(guestRestartedData).toBeTruthy();
        expect(creatorRestartedData).toEqual(guestRestartedData);
        expect((creatorRestartedData.game.algebraicNotation || [""]).slice(-2)).toEqual(["e4", "e5"]);
    })

    test("Should not reconnect to lobby on injection attempts in lobby id", async () => {
        for (const payload of INJECTION_PAYLOADS) {
            await shouldNotReconnect({
                lobbyId: payload,
                playerToken: guestClient!.player.token
            }, HTTPRequestValidatorErrorTemplates.InvalidLobbyId());
        }
    });

    test("Should not reconnect to lobby on injection attempts in player token", async () => {
        for (const payload of INJECTION_PAYLOADS) {
            await shouldNotReconnect({
                lobbyId: testLobbyId!,
                playerToken: payload
            }, HTTPRequestValidatorErrorTemplates.InvalidPlayerToken());
        }
    });
});

afterAll(() => {
    server?.stop(true);
});
