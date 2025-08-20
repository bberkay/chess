import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { WsFinishedData, WsStartedData, WsTitle } from "src/WebSocket";
import { GameStatus, Square } from "@Chess/Types";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { MockClient } from "./helpers/MockClient";
import { LobbyRegistry } from "@Lobby";
import { TEST_BOARD } from "./consts";
import { waitForWebSocketSettle } from "./utils";

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

const createWhiteAndBlackClients = async (remaining: number): Promise<[MockClient, MockClient]> => {
    const creatorClient = new MockCreator(serverUrl, webSocketUrl);
    const { lobbyId } = (await creatorClient.createLobby({ ...TEST_BOARD, remaining: remaining, name: "alex" })).data!;

    const guestClient = new MockGuest(serverUrl, webSocketUrl);
    await guestClient.connectLobby({ name: "alex", lobbyId });

    const startedData: WsStartedData = await guestClient.pull(WsTitle.Started);
    const whitePlayerClient = startedData.players.White.id === guestClient.player!.id
        ? guestClient
        : creatorClient;
    const blackPlayerClient = startedData.players.Black.id === guestClient.player!.id
        ? guestClient
        : creatorClient;

    return [whitePlayerClient, blackPlayerClient];
}

describe("Timer Tests", () => {
    test("Should be able finish the game and inform the players when the timer is over.", async () => {
        const REMAINING = 10000; // 10 seconds total time
        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients(REMAINING);

        // Make first moves to start timer
        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);

        // Wait for {REMAINING} + 1 seconds to ensure the timer runs out
        await waitForWebSocketSettle(REMAINING + 1000);

        // Verify that both players are correctly informed
        const whiteFinishedData: WsFinishedData = await whitePlayerClient.pull(WsTitle.Finished);
        const blackFinishedData: WsFinishedData = await whitePlayerClient.pull(WsTitle.Finished);

        expect(whiteFinishedData).toBeTruthy();
        expect(blackFinishedData).toBeTruthy();
        expect(whiteFinishedData).toEqual(blackFinishedData);
        expect(whiteFinishedData.gameStatus).toBe(GameStatus.BlackVictory);

        // Verify that the lobby finished correctly
        const lobby = LobbyRegistry.get(whitePlayerClient.lobbyId!);
        if (!lobby) throw new Error("Lobby could not found");
        expect(lobby.getGameStatus()).toBe(GameStatus.BlackVictory);
    });
});

afterAll(() => {
    server?.stop(true);
});
