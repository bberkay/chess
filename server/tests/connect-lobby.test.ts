import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { WsConnectedData, WsStartedData, WsTitle } from "src/WebSocket";
import { createLocalBoard } from "./utils";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { HTTPPostBody, HTTPRoutes, HTTPRequestHandlerErrorTemplates, HTTPRequestValidatorErrorTemplates } from "@HTTP";
import { INJECTION_PAYLOADS, TEST_BOARD } from "./consts";
import { Square } from "@Chess/Types";

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

const shouldConnect = async (creatorClient: MockCreator, body: HTTPPostBody[HTTPRoutes.ConnectLobby]) => {
    const guestClient = new MockGuest(serverUrl, webSocketUrl);
    const connectedLobbyResponse = await guestClient.connectLobby(body);
    if (!connectedLobbyResponse.success) {
        throw new Error(`Could not created test lobby: ${connectedLobbyResponse.message}`);
    }

    const creatorConnectedData: WsConnectedData = await creatorClient.pull(WsTitle.Connected);
    const guestConnectedData: WsConnectedData = await guestClient.pull(WsTitle.Connected);

    const creatorStartedData: WsStartedData = await creatorClient!.pull(WsTitle.Started);
    const guestStartedData: WsStartedData = await guestClient.pull(WsTitle.Started);

    // Test
    expect(creatorConnectedData!.playerId).toEqual(creatorClient.player!.id);
    expect(guestConnectedData!.playerId).toEqual(guestClient.player!.id);

    const creatorPlayer = Object.fromEntries(
      Object.entries(creatorClient).filter(([key]) => key !== "token")
    );
    const guestPlayer = Object.fromEntries(
      Object.entries(guestClient).filter(([key]) => key !== "token")
    );

    if (creatorStartedData.players.White.id === creatorClient.player!.id) {
        // If creator is white, connector is black
        expect(creatorStartedData!.players.White).toEqual(creatorPlayer);
        expect(creatorStartedData!.players.Black).toEqual(guestPlayer);
        expect(guestStartedData!.players.White).toEqual(creatorPlayer);
        expect(guestStartedData!.players.Black).toEqual(guestPlayer);
    } else {
        // If creator is black, connector is white
        expect(creatorStartedData!.players.Black).toEqual(creatorPlayer);
        expect(creatorStartedData!.players.White).toEqual(guestPlayer);
        expect(guestStartedData!.players.White).toEqual(creatorPlayer);
        expect(guestStartedData!.players.Black).toEqual(guestPlayer);
    }

    expect(creatorStartedData!.game).toEqual(guestStartedData!.game);
    expect(creatorStartedData!.game).toEqual(createLocalBoard(TEST_BOARD));
}

const shouldNotConnect = async (body: HTTPPostBody[HTTPRoutes.ConnectLobby], errMsg?: string) => {
    const guestClient = new MockGuest(serverUrl, webSocketUrl);
    const connectedLobbyResponse = await guestClient.connectLobby(body);
    expect(connectedLobbyResponse.success).toBe(false);
    if (errMsg) expect(connectedLobbyResponse.message).toBe(errMsg);
}

describe("Connect Lobby Tests", () => {
    test("Should connect to lobby and receive necessery data via HTTP request", async () => {
        const creatorClient = await createTestLobby();
        await shouldConnect(creatorClient, {
            name: "alex",
            lobbyId: creatorClient.lobbyId!
        })
    })

    test("Should not connect to lobby when name is empty", async () => {
        const creatorClient = await createTestLobby();
        await shouldNotConnect({
            name: "",
            lobbyId: creatorClient.lobbyId!
        }, HTTPRequestValidatorErrorTemplates.InvalidNameLength());
    });

    test("Should not connect to lobby when name is too long", async () => {
        const creatorClient = await createTestLobby();
        await shouldNotConnect({
            name: "johnnnnnnnnnnnnnnnnnnnnnnnnnnn",
            lobbyId: creatorClient.lobbyId!
        }, HTTPRequestValidatorErrorTemplates.InvalidNameLength());
    });

    test("Should not connect to lobby on injection attempts in name", async () => {
        for (const payload of INJECTION_PAYLOADS) {
            const creatorClient = await createTestLobby();
            await shouldNotConnect({
                name: payload,
                lobbyId: creatorClient.lobbyId!
            }, HTTPRequestValidatorErrorTemplates.InvalidName());
        }
    });

    test("Should not connect to lobby on injection attempts in lobby id", async () => {
        for (const payload of INJECTION_PAYLOADS) {
            await createTestLobby();
            await shouldNotConnect({
                name: "alex",
                lobbyId: payload
            }, HTTPRequestValidatorErrorTemplates.InvalidLobbyId());
        }
    });

    test("Should not connect to lobby when lobby id is not exists", async () => {
        await createTestLobby();
        const invalidLobbyId = "000001";
        await shouldNotConnect({
            name: "alex",
            lobbyId: invalidLobbyId
        }, HTTPRequestHandlerErrorTemplates.LobbyNotFound(invalidLobbyId));
    });

    test("Should not connect to lobby if lobby is already started", async () => {
        const creatorClient = await createTestLobby();
        await shouldConnect(creatorClient, {
            name: "alex",
            lobbyId: creatorClient.lobbyId!
        });

        // Lobby will be in "started" status, right after "alex" connected.
        // so no one should be able to connect to it.
        await shouldNotConnect({
            name: "terry",
            lobbyId: creatorClient.lobbyId!
        }, HTTPRequestHandlerErrorTemplates.LobbyAlreadyStarted(creatorClient.lobbyId!));
    });

    test("Should not connect to lobby if lobby is not started but full", async () => {
        const creatorClient = await createTestLobby({
            name: "john",
            board: "k7/8/4rp2/8/8/8/1R5K/1R6 w - - 0 1",
            remaining: 30000,
            increment: 5000
        });

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId: creatorClient.lobbyId! });
        const startedData: WsStartedData = await guestClient.pull(WsTitle.Started);

        const whitePlayerClient = startedData.players.White.id === guestClient.player!.id
            ? guestClient
            : creatorClient;
        const blackPlayerClient = startedData.players.Black.id === guestClient.player!.id
            ? guestClient
            : creatorClient;

        whitePlayerClient.move(Square.b2, Square.a2);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e6, Square.a6);
        await whitePlayerClient.pull(WsTitle.Moved);
        whitePlayerClient.move(Square.a2, Square.a6);
        await blackPlayerClient.pull(WsTitle.Moved);

        // Game should be finished at this point.
        // So lobby status will be "not started" but
        // lobby still will be full so no one be able to
        // connect to it.

        await shouldNotConnect({
            name: "terry",
            lobbyId: creatorClient.lobbyId!
        }, HTTPRequestHandlerErrorTemplates.LobbyFull(creatorClient.lobbyId!));
    });
});

afterAll(() => {
    server?.stop(true);
});
