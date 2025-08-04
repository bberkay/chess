import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { WsStartedData, WsTitle } from "src/WebSocket";
import { Square } from "@Chess/Types";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { MockClient } from "./helpers/MockClient";

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

const createWhiteAndBlackClients = async (creatorClient: MockCreator, guestClient: MockGuest): Promise<[MockClient, MockClient]> => {
    creatorClient = new MockCreator(serverUrl, webSocketUrl);
    const { lobbyId } = (await creatorClient.createLobby()).data!;

    guestClient = new MockGuest(serverUrl, webSocketUrl);
    await guestClient.connectLobby({ name: "alex", lobbyId });

    const startedData: WsStartedData = await guestClient.pull(WsTitle.Started);
    const whitePlayerClient = startedData.players.White.id === guestClient.player.id
        ? guestClient
        : creatorClient;
    const blackPlayerClient = startedData.players.Black.id === guestClient.player.id
        ? guestClient
        : creatorClient;

    return [whitePlayerClient, blackPlayerClient];
}

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

describe("Play Again Tests", () => {
    test("Should creator be able to abort game if the game is not started", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        await creatorClient.createLobby()
        creatorClient.abortGame();
        await creatorClient.pull(WsTitle.Aborted);
    });

    test("Should guest be able to abort game if the game is not started", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby()).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });

        guestClient.abortGame();
        await creatorClient.pull(WsTitle.Aborted);
        await guestClient.pull(WsTitle.Aborted);
    });

    test("Should creator be able to abort game if no move is played", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby()).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });

        creatorClient.abortGame();
        await creatorClient.pull(WsTitle.Aborted);
        await guestClient.pull(WsTitle.Aborted);
    });

    test("Should creator be able to abort game if both sides are not played their own starter moves.", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const guestClient = new MockGuest(serverUrl, webSocketUrl);

        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients(creatorClient, guestClient);

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);

        creatorClient.abortGame();
        await creatorClient.pull(WsTitle.Aborted);
        await guestClient.pull(WsTitle.Aborted);
    });

    test("Should guest be able to abort game if both sides are not played their own starter moves", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const guestClient = new MockGuest(serverUrl, webSocketUrl);

        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients(creatorClient, guestClient);

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);

        guestClient.abortGame();
        await creatorClient.pull(WsTitle.Aborted);
        await guestClient.pull(WsTitle.Aborted);
    });

    test("Should creator not be able to abort game if both sides are played their own starter moves.", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const guestClient = new MockGuest(serverUrl, webSocketUrl);

        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients(creatorClient, guestClient);

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);

        creatorClient.abortGame();
        await expect(creatorClient.pull(WsTitle.Aborted)).rejects.toThrow("Could not poll from pool.");
        await expect(guestClient.pull(WsTitle.Aborted)).rejects.toThrow("Could not poll from pool.");
    });

    test("Should guest not be able to abort game if both sides are played their own starter moves", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const guestClient = new MockGuest(serverUrl, webSocketUrl);

        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients(creatorClient, guestClient);

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);

        guestClient.abortGame();
        await expect(creatorClient.pull(WsTitle.Aborted)).rejects.toThrow("Could not poll from pool.");
        await expect(guestClient.pull(WsTitle.Aborted)).rejects.toThrow("Could not poll from pool.");
    });

    test("Should creator be able to abort game if the game is taken back to initial status", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const guestClient = new MockGuest(serverUrl, webSocketUrl);

        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients(creatorClient, guestClient);

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);

        whitePlayerClient.sendUndoOffer();
        await blackPlayerClient.pull(WsTitle.UndoOffered);

        blackPlayerClient.acceptUndoOffer();
        await whitePlayerClient.pull(WsTitle.UndoAccepted);
        await blackPlayerClient.pull(WsTitle.UndoAccepted);

        creatorClient.abortGame();
        await creatorClient.pull(WsTitle.Aborted);
        await guestClient.pull(WsTitle.Aborted);
    });

    test("Should guest be able to abort game if the game is taken back to initial status", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const guestClient = new MockGuest(serverUrl, webSocketUrl);

        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients(creatorClient, guestClient);

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);

        whitePlayerClient.sendUndoOffer();
        await blackPlayerClient.pull(WsTitle.UndoOffered);

        blackPlayerClient.acceptUndoOffer();
        await whitePlayerClient.pull(WsTitle.UndoAccepted);
        await blackPlayerClient.pull(WsTitle.UndoAccepted);

        guestClient.abortGame();
        await creatorClient.pull(WsTitle.Aborted);
        await guestClient.pull(WsTitle.Aborted);
    });
});

afterAll(() => {
    server?.stop(true);
});
