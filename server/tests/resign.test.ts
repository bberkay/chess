import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe, beforeEach } from "vitest";
import { type Server } from "bun";
import { pruneIPMessages, WsStartedData, WsTitle } from "@WebSocket";
import { GameStatus, Square, StartPosition } from "@Chess/Types";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { MockClient, MockClientPullErrorMsg } from "./helpers/MockClient";
import { WebSocketHandlerErrorTemplates } from "src/WebSocket/WebSocketHandlerError";
import { LobbyRegistry } from "@Lobby";
import { TEST_BOARD } from "./consts";
import { pruneIPRequests } from "@HTTP";

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

const createWhiteAndBlackClients = async (board?: string): Promise<[MockClient, MockClient]> => {
    const creatorClient = new MockCreator(serverUrl, webSocketUrl);
    const { lobbyId } = (await creatorClient.createLobby({ ...TEST_BOARD, board: board ?? TEST_BOARD.board, name: "alex" })).data!;

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

const shouldGameStatusBe = (lobbyId: string, gameStatus: GameStatus) => {
    const lobby = LobbyRegistry.get(lobbyId);
    if (!lobby) throw new Error("Lobby could not found");
    expect(lobby.getGameStatus()).toBe(gameStatus);
}

const shouldNotGameFinished = (lobbyId: string) => {
    const lobby = LobbyRegistry.get(lobbyId);
    if (!lobby) throw new Error("Lobby could not found");
    expect(lobby.getGameStatus()).not.toBe(GameStatus.WhiteVictory);
    expect(lobby.getGameStatus()).not.toBe(GameStatus.BlackVictory);
    expect(lobby.getGameStatus()).not.toBe(GameStatus.Draw);
}

describe("Resign Tests", () => {
    test("Should not be able to resign if no move played/abort available", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        whitePlayerClient.resign();
        await expect(
            whitePlayerClient.pull(WsTitle.Resigned),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.Resigned),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.ResignFromGameFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should not be able to resign if game is already finished", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients(StartPosition.Checkmate);

        whitePlayerClient.move(Square.b1, Square.a1);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e6, Square.a6);
        await whitePlayerClient.pull(WsTitle.Moved);
        whitePlayerClient.move(Square.a1, Square.a6);
        await blackPlayerClient.pull(WsTitle.Moved);

        whitePlayerClient.resign();
        await expect(
            whitePlayerClient.pull(WsTitle.Resigned),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.Resigned),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.ResignFromGameFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );
        shouldGameStatusBe(whitePlayerClient.lobbyId!, GameStatus.WhiteVictory);
    });

    test("Should white be able to resign if its white's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);

        whitePlayerClient.resign();
        await whitePlayerClient.pull(WsTitle.Resigned);
        const resignedData = await blackPlayerClient.pull(WsTitle.Resigned);
        shouldGameStatusBe(whitePlayerClient.lobbyId!, resignedData!.gameStatus);
    });

    test("Should white be able to resign if its black's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);
        whitePlayerClient.move(Square.d2, Square.d4);
        await blackPlayerClient.pull(WsTitle.Moved);

        whitePlayerClient.resign();
        await whitePlayerClient.pull(WsTitle.Resigned);
        const resignedData = await blackPlayerClient.pull(WsTitle.Resigned);
        shouldGameStatusBe(whitePlayerClient.lobbyId!, resignedData!.gameStatus);
    });

    test("Should black be able to resign if its white's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);

        blackPlayerClient.resign();
        await whitePlayerClient.pull(WsTitle.Resigned);
        const resignedData = await blackPlayerClient.pull(WsTitle.Resigned);
        shouldGameStatusBe(blackPlayerClient.lobbyId!, resignedData!.gameStatus);
    });

    test("Should black be able to resign if its black's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);
        whitePlayerClient.move(Square.d2, Square.d4);
        await blackPlayerClient.pull(WsTitle.Moved);

        blackPlayerClient.resign();
        await whitePlayerClient.pull(WsTitle.Resigned);
        const resignedData = await blackPlayerClient.pull(WsTitle.Resigned);
        shouldGameStatusBe(blackPlayerClient.lobbyId!, resignedData!.gameStatus);
    });
});

afterAll(() => {
    server?.stop(true);
});
