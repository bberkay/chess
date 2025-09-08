import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { WsFinishedData, WsStartedData, WsTitle } from "src/WebSocket";
import { GameStatus, Square, StartPosition } from "@Chess/Types";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { MockClient, MockClientPullErrorMsg } from "./helpers/MockClient";
import { WebSocketHandlerErrorTemplates } from "src/WebSocket/WebSocketHandlerError";
import { LobbyRegistry } from "@Lobby";
import { TEST_BOARD } from "./consts";

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
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

const shouldBoardBe = (lobbyId: string, targetBoard: string) => {
    const lobby = LobbyRegistry.get(lobbyId);
    if (!lobby) throw new Error("Lobby could not found");
    expect(lobby.getGameAsFenNotation()).toBe(targetBoard);
};

describe("Move Tests", () => {
    test("Should be able to play as white and black", async () => {
        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        shouldBoardBe(whitePlayerClient.lobbyId!, "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");

        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);
        shouldBoardBe(whitePlayerClient.lobbyId!, "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2");
    });

    test("Should be able send finished message after the finisher move has played", async () => {
        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients(StartPosition.Checkmate);

        whitePlayerClient.move(Square.b1, Square.a1);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e6, Square.a6);
        await whitePlayerClient.pull(WsTitle.Moved);
        whitePlayerClient.move(Square.a1, Square.a6);
        await blackPlayerClient.pull(WsTitle.Moved);

        const whiteFinishedData: WsFinishedData = await whitePlayerClient.pull(WsTitle.Finished);
        const blackFinishedData: WsFinishedData = await blackPlayerClient.pull(WsTitle.Finished);

        expect(whiteFinishedData).toBeTruthy();
        expect(blackFinishedData).toBeTruthy();
        expect(whiteFinishedData).toEqual(blackFinishedData);
        expect(whiteFinishedData.gameStatus).toBe(GameStatus.WhiteVictory);
        shouldBoardBe(whitePlayerClient.lobbyId!, "k7/8/R4p2/8/8/8/1R5K/8 b - - 0 2");
    });

    test("Should not be able to play repeatedly", async () => {
        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        shouldBoardBe(whitePlayerClient.lobbyId!, "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");

        const from = Square.e4;
        const to = Square.e5;
        whitePlayerClient.move(from, to);
        await expect(
            blackPlayerClient.pull(WsTitle.Moved),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.PlayMoveFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token, from, to),
        );
        shouldBoardBe(whitePlayerClient.lobbyId!, "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
    });

    test("Should not be able to play after the game has finished", async () => {
        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients(StartPosition.Checkmate);

        whitePlayerClient.move(Square.b1, Square.a1);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e6, Square.a6);
        await whitePlayerClient.pull(WsTitle.Moved);
        whitePlayerClient.move(Square.a1, Square.a6);
        await blackPlayerClient.pull(WsTitle.Moved);

        const from = Square.a6;
        const to = Square.a7;
        whitePlayerClient.move(from, to);
        await expect(
            blackPlayerClient.pull(WsTitle.Moved),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.PlayMoveFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token, from, to),
        );
        shouldBoardBe(whitePlayerClient.lobbyId!, "k7/8/R4p2/8/8/8/1R5K/8 b - - 0 2");
    });

    test("Should not be able to play invalid move", async () => {
        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);

        const from = Square.e8;
        const to = Square.e8;
        blackPlayerClient.move(from, to);
        await expect(
            whitePlayerClient.pull(WsTitle.Moved),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await blackPlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.PlayMoveFailed(whitePlayerClient.lobbyId!, blackPlayerClient.player!.token, from, to),
        );

        shouldBoardBe(whitePlayerClient.lobbyId!, "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
    });

    test("Should not be able to play opponent's pieces", async () => {
        const [whitePlayerClient, blackPlayerClient] = await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);

        const from = Square.e4;
        const to = Square.e5;
        blackPlayerClient.move(from, to);
        await expect(
            whitePlayerClient.pull(WsTitle.Moved),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await blackPlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.PlayMoveFailed(whitePlayerClient.lobbyId!, blackPlayerClient.player!.token, from, to),
        );

        shouldBoardBe(whitePlayerClient.lobbyId!, "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
    });
});

afterAll(() => {
    server?.stop(true);
});
