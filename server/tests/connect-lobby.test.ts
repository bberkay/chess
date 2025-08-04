import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { WsConnectedData, WsStartedData, WsTitle } from "src/WebSocket";
import { createLocalBoard } from "./utils";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

describe("Connect Lobby Tests", () => {
    test("Should create and/or connect then receive necessary data", async () => {
        // Creator
        const CREATOR_LOBBY_DATA = {
            name: "john",
            board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            remaining: 300000,
            increment: 5000,
        }

        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby(CREATOR_LOBBY_DATA)).data!;
        const creatorConnectedData: WsConnectedData = await creatorClient.pull(WsTitle.Connected);

        // Guest
        const GUEST_LOBBY_DATA = {
            name: "alex",
            lobbyId
        };
        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby(GUEST_LOBBY_DATA);
        const guestConnectedData: WsConnectedData = await guestClient.pull(WsTitle.Connected);

        const creatorStartedData: WsStartedData = await creatorClient.pull(WsTitle.Started);
        const guestStartedData: WsStartedData = await guestClient.pull(WsTitle.Started);

        // Test
        expect(creatorConnectedData!.playerId).toEqual(creatorClient.player.id);
        expect(guestConnectedData!.playerId).toEqual(guestClient.player.id);

        if (creatorStartedData.players.White.id === creatorClient.player.id) {
            // If creator is white, connector is black
            expect(creatorStartedData!.players.White).toEqual(creatorClient.playerWithoutToken);
            expect(creatorStartedData!.players.Black).toEqual(guestClient.playerWithoutToken);
            expect(guestStartedData!.players.White).toEqual(creatorClient.playerWithoutToken);
            expect(guestStartedData!.players.Black).toEqual(guestClient.playerWithoutToken);
        } else {
            // If creator is black, connector is white
            expect(creatorStartedData!.players.Black).toEqual(creatorClient.playerWithoutToken);
            expect(creatorStartedData!.players.White).toEqual(guestClient.playerWithoutToken);
            expect(guestStartedData!.players.White).toEqual(creatorClient.playerWithoutToken);
            expect(guestStartedData!.players.Black).toEqual(guestClient.playerWithoutToken);
        }

        const awaitedBoard = createLocalBoard(CREATOR_LOBBY_DATA);
        expect(creatorStartedData!.game).toEqual(awaitedBoard);
        expect(guestStartedData!.game).toEqual(awaitedBoard);
    })
});

afterAll(() => {
    server?.stop(true);
});
