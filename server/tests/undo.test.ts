import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { WsStartedData, WsTitle, WsUndoData } from "src/WebSocket";
import { Color, Square } from "@Chess/Types";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { MockClient, MockClientPullErrorMsg } from "./helpers/MockClient";
import { WebSocketHandlerErrorTemplates } from "src/WebSocket/WebSocketHandlerError";
import { LobbyRegistry } from "@Lobby";

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

const playUntilUndoIsAvailable = async (): Promise<
    [MockClient, MockClient, string]
> => {
    const creatorClient = new MockCreator(serverUrl, webSocketUrl);
    const { lobbyId } = (await creatorClient.createLobby()).data!;

    const guestClient = new MockGuest(serverUrl, webSocketUrl);
    await guestClient.connectLobby({ name: "alex", lobbyId });
    const startedData: WsStartedData = await guestClient.pull(WsTitle.Started);

    const whitePlayerClient =
        startedData.players.White.id === guestClient.player!.id
            ? guestClient
            : creatorClient;
    const blackPlayerClient =
        startedData.players.Black.id === guestClient.player!.id
            ? guestClient
            : creatorClient;

    whitePlayerClient.move(Square.e2, Square.e4);
    await blackPlayerClient.pull(WsTitle.Moved);
    blackPlayerClient.move(Square.e7, Square.e5);
    await whitePlayerClient.pull(WsTitle.Moved);

    const lobby = LobbyRegistry.get(lobbyId);
    if (!lobby) throw new Error("Lobby could not found");

    return [whitePlayerClient, blackPlayerClient, lobby.getGameAsFenNotation()];
};

const shouldBoardBe = (lobbyId: string, targetBoard: string) => {
    const lobby = LobbyRegistry.get(lobbyId);
    if (!lobby) throw new Error("Lobby could not found");
    expect(lobby.getGameAsFenNotation()).toBe(targetBoard);
};

describe("Undo Tests", () => {
    test("Should be able to offer undo when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient, lastBoard] =
            await playUntilUndoIsAvailable();

        whitePlayerClient.sendUndoOffer();
        await blackPlayerClient.pull(WsTitle.UndoOffered);
        shouldBoardBe(whitePlayerClient.lobbyId!, lastBoard);
    });

    test("Should be able to offer undo when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient, lastBoard] =
            await playUntilUndoIsAvailable();

        blackPlayerClient.sendUndoOffer();
        await whitePlayerClient.pull(WsTitle.UndoOffered);
        shouldBoardBe(whitePlayerClient.lobbyId!, lastBoard);
    });

    test("Should be able to accept undo offer when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await playUntilUndoIsAvailable();

        blackPlayerClient.sendUndoOffer();
        await whitePlayerClient.pull(WsTitle.UndoOffered);

        whitePlayerClient.acceptUndoOffer();
        const whiteUndoAcceptedData: WsUndoData = (await whitePlayerClient.pull(
            WsTitle.UndoAccepted,
        )) as WsUndoData;

        const blackUndoAcceptedData: WsUndoData = (await blackPlayerClient.pull(
            WsTitle.UndoAccepted,
        )) as WsUndoData;

        expect(whiteUndoAcceptedData).toBeTruthy();
        expect(blackUndoAcceptedData).toBeTruthy();
        expect(whiteUndoAcceptedData.undoColor).toBe(Color.Black);
        expect(whiteUndoAcceptedData.board).toBe(
            "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        );
        expect(whiteUndoAcceptedData).toEqual(blackUndoAcceptedData);
        shouldBoardBe(whitePlayerClient.lobbyId!, whiteUndoAcceptedData.board);
    });

    test("Should be able to accept undo offer when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await playUntilUndoIsAvailable();

        whitePlayerClient.sendUndoOffer();
        await blackPlayerClient.pull(WsTitle.UndoOffered);

        blackPlayerClient.acceptUndoOffer();
        const whiteUndoAcceptedData: WsUndoData = (await whitePlayerClient.pull(
            WsTitle.UndoAccepted,
        )) as WsUndoData;
        const blackUndoAcceptedData: WsUndoData = (await blackPlayerClient.pull(
            WsTitle.UndoAccepted,
        )) as WsUndoData;

        expect(whiteUndoAcceptedData).toBeTruthy();
        expect(blackUndoAcceptedData).toBeTruthy();
        expect(whiteUndoAcceptedData.undoColor).toBe(Color.White);
        expect(whiteUndoAcceptedData.board).toBe(
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        );
        expect(whiteUndoAcceptedData).toEqual(blackUndoAcceptedData);
        shouldBoardBe(whitePlayerClient.lobbyId!, whiteUndoAcceptedData.board);
    });

    test("Should be able to decline undo offer when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient, lastBoard] =
            await playUntilUndoIsAvailable();

        blackPlayerClient.sendUndoOffer();
        await whitePlayerClient.pull(WsTitle.UndoOffered);

        whitePlayerClient.declineOffer();
        await blackPlayerClient.pull(WsTitle.OfferDeclined);
        shouldBoardBe(whitePlayerClient.lobbyId!, lastBoard);
    });

    test("Should be able to decline undo offer when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient, lastBoard] =
            await playUntilUndoIsAvailable();

        whitePlayerClient.sendUndoOffer();
        await blackPlayerClient.pull(WsTitle.UndoOffered);

        blackPlayerClient.declineOffer();
        await whitePlayerClient.pull(WsTitle.OfferDeclined);
        shouldBoardBe(whitePlayerClient.lobbyId!, lastBoard);
    });

    test("Should be able to cancel undo offer when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient, lastBoard] =
            await playUntilUndoIsAvailable();

        blackPlayerClient.sendUndoOffer();
        blackPlayerClient.cancelOffer();
        await whitePlayerClient.pull(WsTitle.OfferCancelled);
        shouldBoardBe(whitePlayerClient.lobbyId!, lastBoard);
    });

    test("Should be able to cancel undo offer when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient, lastBoard] =
            await playUntilUndoIsAvailable();

        whitePlayerClient.sendUndoOffer();
        whitePlayerClient.cancelOffer();
        await blackPlayerClient.pull(WsTitle.OfferCancelled);
        shouldBoardBe(whitePlayerClient.lobbyId!, lastBoard);
    });

    test("Should not be able to accept undo offer that is cancelled when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient, lastBoard] =
            await playUntilUndoIsAvailable();

        // Cancel undo before opponent accept it.
        blackPlayerClient.sendUndoOffer();
        blackPlayerClient.cancelOffer();
        await whitePlayerClient.pull(WsTitle.OfferCancelled);

        // Should not accept after offer cancelled
        whitePlayerClient.acceptUndoOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.UndoAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.UndoAcceptFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );

        shouldBoardBe(whitePlayerClient.lobbyId!, lastBoard);
    });

    test("Should not be able to accept undo offer that is cancelled when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient, lastBoard] =
            await playUntilUndoIsAvailable();

        // Cancel undo before opponent accept it.
        whitePlayerClient.sendUndoOffer();
        whitePlayerClient.cancelOffer();
        await blackPlayerClient.pull(WsTitle.OfferCancelled);

        // Should not accept after offer cancelled
        blackPlayerClient.acceptUndoOffer();
        await expect(
            blackPlayerClient.pull(WsTitle.UndoAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await blackPlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.UndoAcceptFailed(blackPlayerClient.lobbyId!, blackPlayerClient.player!.token),
        );

        shouldBoardBe(whitePlayerClient.lobbyId!, lastBoard);
    });

    test("Should not be able to accept undo offer that is declined when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient, lastBoard] =
            await playUntilUndoIsAvailable();

        // Cancel undo before opponent accept it.
        blackPlayerClient.sendUndoOffer();
        await whitePlayerClient.pull(WsTitle.UndoOffered);
        whitePlayerClient.declineOffer();
        await blackPlayerClient.pull(WsTitle.OfferDeclined);

        // Should not accept after offer declined
        whitePlayerClient.acceptUndoOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.UndoAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.UndoAcceptFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );

        shouldBoardBe(whitePlayerClient.lobbyId!, lastBoard);
    });

    test("Should not be able to accept undo offer that is declined when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient, lastBoard] =
            await playUntilUndoIsAvailable();

        // Cancel undo before player accept it.
        whitePlayerClient.sendUndoOffer();
        await blackPlayerClient.pull(WsTitle.UndoOffered);
        blackPlayerClient.declineOffer();
        await whitePlayerClient.pull(WsTitle.OfferDeclined);

        // Should not accept after offer declined
        blackPlayerClient.acceptUndoOffer();
        await expect(
            blackPlayerClient.pull(WsTitle.UndoAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await blackPlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.UndoAcceptFailed(blackPlayerClient.lobbyId!, blackPlayerClient.player!.token),
        );

        shouldBoardBe(whitePlayerClient.lobbyId!, lastBoard);
    });

    test("Should not be able to accept undo offer that is already accepted when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await playUntilUndoIsAvailable();

        // Cancel undo before opponent accept it.
        blackPlayerClient.sendUndoOffer();
        await whitePlayerClient.pull(WsTitle.UndoOffered);
        whitePlayerClient.acceptUndoOffer();

        const whitePlayerUndoAccepted = await whitePlayerClient.pull(WsTitle.UndoAccepted);
        const blackPlayerUndoAccepted = await blackPlayerClient.pull(WsTitle.UndoAccepted);

        // Should not accept after offer already accepted
        whitePlayerClient.acceptUndoOffer();
        await expect(
            blackPlayerClient.pull(WsTitle.UndoAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.UndoAcceptFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );

        expect(whitePlayerUndoAccepted).toBeTruthy();
        expect(blackPlayerClient).toBeTruthy();
        expect(whitePlayerUndoAccepted).toEqual(blackPlayerUndoAccepted);
        shouldBoardBe(whitePlayerClient.lobbyId!, whitePlayerUndoAccepted!.board);
    });

    test("Should not be able to accept undo offer that is already accepted when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await playUntilUndoIsAvailable();

        // Cancel undo before player accept it.
        whitePlayerClient.sendUndoOffer();
        await blackPlayerClient.pull(WsTitle.UndoOffered);
        blackPlayerClient.acceptUndoOffer();

        const whitePlayerUndoAccepted = await whitePlayerClient.pull(WsTitle.UndoAccepted);
        const blackPlayerUndoAccepted = await blackPlayerClient.pull(WsTitle.UndoAccepted);

        // Should not accept after offer already accepted
        blackPlayerClient.acceptUndoOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.UndoAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await blackPlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.UndoAcceptFailed(blackPlayerClient.lobbyId!, blackPlayerClient.player!.token),
        );

        expect(whitePlayerUndoAccepted).toBeTruthy();
        expect(blackPlayerClient).toBeTruthy();
        expect(whitePlayerUndoAccepted).toEqual(blackPlayerUndoAccepted);
        shouldBoardBe(whitePlayerClient.lobbyId!, whitePlayerUndoAccepted!.board);
    });
});

afterAll(() => {
    server?.stop(true);
});
