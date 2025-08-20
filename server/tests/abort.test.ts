import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { WsStartedData, WsTitle } from "src/WebSocket";
import { GameStatus, Square } from "@Chess/Types";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { MockClient, MockClientPullErrorMsg } from "./helpers/MockClient";
import { LobbyRegistry } from "@Lobby";
import { WebSocketHandlerErrorTemplates } from "src/WebSocket/WebSocketHandlerError";

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

const createWhiteAndBlackClients = async (): Promise<[MockClient, MockClient]> => {
    const creatorClient = new MockCreator(serverUrl, webSocketUrl);
    const { lobbyId } = (await creatorClient.createLobby()).data!;

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

const shouldGameFinished = (lobbyId: string) => {
    const lobby = LobbyRegistry.get(lobbyId);
    if (!lobby) throw new Error("Lobby could not found");
    expect(lobby.getGameStatus()).toBe(GameStatus.ReadyToStart);
}

const shouldNotGameFinished = (lobbyId: string) => {
    const lobby = LobbyRegistry.get(lobbyId);
    if (!lobby) throw new Error("Lobby could not found");
    expect(lobby.getGameStatus()).not.toBe(GameStatus.ReadyToStart);
}

describe("Abort Tests", () => {
    test("Should creator be able to abort game if the game is not started", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        await creatorClient.createLobby()
        creatorClient.abortGame();
        await creatorClient.pull(WsTitle.Aborted);
        shouldGameFinished(creatorClient.lobbyId!);
    });

    test("Should guest be able to abort game if the game is not started", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby()).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });

        guestClient.abortGame();
        await creatorClient.pull(WsTitle.Aborted);
        await guestClient.pull(WsTitle.Aborted);
        shouldGameFinished(creatorClient.lobbyId!);
    });

    test("Should creator be able to abort game if no move is played", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby()).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });

        creatorClient.abortGame();
        await creatorClient.pull(WsTitle.Aborted);
        await guestClient.pull(WsTitle.Aborted);
        shouldGameFinished(creatorClient.lobbyId!);
    });

    test("Should white be able to abort game if both sides are not played their own starter moves.", async () => {
        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);

        whitePlayerClient.abortGame();
        await whitePlayerClient.pull(WsTitle.Aborted);
        await blackPlayerClient.pull(WsTitle.Aborted);
        shouldGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should black be able to abort game if both sides are not played their own starter moves", async () => {
        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);

        blackPlayerClient.abortGame();
        await whitePlayerClient.pull(WsTitle.Aborted);
        await blackPlayerClient.pull(WsTitle.Aborted);
        shouldGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should white not be able to abort game if both sides are played their own starter moves.", async () => {
        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);

        whitePlayerClient.abortGame();
        await expect(
            whitePlayerClient.pull(WsTitle.Aborted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.Aborted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.AbortGameFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should black not be able to abort game if both sides are played their own starter moves", async () => {
        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);

        blackPlayerClient.abortGame();
        await expect(
            whitePlayerClient.pull(WsTitle.Aborted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.Aborted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await blackPlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.AbortGameFailed(blackPlayerClient.lobbyId!, blackPlayerClient.player!.token),
        );
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should white be able to abort game if the game is taken back to initial status", async () => {
        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);

        whitePlayerClient.sendUndoOffer();
        await blackPlayerClient.pull(WsTitle.UndoOffered);

        blackPlayerClient.acceptUndoOffer();
        await whitePlayerClient.pull(WsTitle.UndoAccepted);
        await blackPlayerClient.pull(WsTitle.UndoAccepted);

        whitePlayerClient.abortGame();
        await whitePlayerClient.pull(WsTitle.Aborted);
        await blackPlayerClient.pull(WsTitle.Aborted);
        shouldGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should black be able to abort game if the game is taken back to initial status", async () => {
        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);

        whitePlayerClient.sendUndoOffer();
        await blackPlayerClient.pull(WsTitle.UndoOffered);

        blackPlayerClient.acceptUndoOffer();
        await whitePlayerClient.pull(WsTitle.UndoAccepted);
        await blackPlayerClient.pull(WsTitle.UndoAccepted);

        blackPlayerClient.abortGame();
        await whitePlayerClient.pull(WsTitle.Aborted);
        await blackPlayerClient.pull(WsTitle.Aborted);
        shouldGameFinished(whitePlayerClient.lobbyId!);
    });
});

afterAll(() => {
    server?.stop(true);
});
