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

const playUntilDrawIsAvailable = async (whitePlayerClient: MockClient, blackPlayerClient: MockClient) => {
    whitePlayerClient.move(Square.e2, Square.e4);
    await blackPlayerClient.pull(WsTitle.Moved);
    blackPlayerClient.move(Square.e7, Square.e5);
    await whitePlayerClient.pull(WsTitle.Moved);
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

describe("Draw Tests", () => {
    test("Should be able to offer draw when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        whitePlayerClient.sendDrawOffer();
        await blackPlayerClient.pull(WsTitle.DrawOffered);
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should be able to offer draw when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        blackPlayerClient.sendDrawOffer();
        await whitePlayerClient.pull(WsTitle.DrawOffered);
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should be able to accept draw offer when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        whitePlayerClient.sendDrawOffer();
        await blackPlayerClient.pull(WsTitle.DrawOffered);

        blackPlayerClient.acceptDrawOffer();
        await whitePlayerClient.pull(WsTitle.DrawAccepted)
        await blackPlayerClient.pull(WsTitle.DrawAccepted)

        shouldGameStatusBe(whitePlayerClient.lobbyId!, GameStatus.Draw);
    });

    test("Should be able to accept draw offer when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        blackPlayerClient.sendDrawOffer();
        await whitePlayerClient.pull(WsTitle.DrawOffered);

        whitePlayerClient.acceptDrawOffer();
        await whitePlayerClient.pull(WsTitle.DrawAccepted)
        await blackPlayerClient.pull(WsTitle.DrawAccepted)

        shouldGameStatusBe(whitePlayerClient.lobbyId!, GameStatus.Draw);
    });

    test("Should be able to decline draw offer when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        blackPlayerClient.sendDrawOffer();
        await whitePlayerClient.pull(WsTitle.DrawOffered);

        whitePlayerClient.declineOffer();
        await blackPlayerClient.pull(WsTitle.OfferDeclined);
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should be able to decline draw offer when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        whitePlayerClient.sendDrawOffer();
        await blackPlayerClient.pull(WsTitle.DrawOffered);

        blackPlayerClient.declineOffer();
        await whitePlayerClient.pull(WsTitle.OfferDeclined);
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should be able to cancel draw offer when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        whitePlayerClient.sendDrawOffer();
        whitePlayerClient.cancelOffer();
        await blackPlayerClient.pull(WsTitle.OfferCancelled);
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should be able to cancel draw offer when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        blackPlayerClient.sendDrawOffer();
        blackPlayerClient.cancelOffer();
        await whitePlayerClient.pull(WsTitle.OfferCancelled);
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should not be able to send draw offer if no move has played/abort available", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        whitePlayerClient.sendDrawOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.DrawOffered),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.DrawOffered),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.DrawOfferFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should not be able to accept draw offer if there is no sent draw offer", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        whitePlayerClient.acceptDrawOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.DrawAcceptFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should not be able to accept draw offer if the offerer is same with the player", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e7, Square.e5);
        await whitePlayerClient.pull(WsTitle.Moved);
        whitePlayerClient.sendDrawOffer();
        await blackPlayerClient.pull(WsTitle.DrawOffered);

        whitePlayerClient.acceptDrawOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.DrawAcceptFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should not be able to send draw offer if game is already finished", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients(StartPosition.Checkmate);

        whitePlayerClient.move(Square.b1, Square.a1);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e6, Square.a6);
        await whitePlayerClient.pull(WsTitle.Moved);
        whitePlayerClient.move(Square.a1, Square.a6);
        await blackPlayerClient.pull(WsTitle.Moved);

        whitePlayerClient.sendDrawOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.DrawOffered),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.DrawOffered),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.DrawOfferFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );
        shouldGameStatusBe(whitePlayerClient.lobbyId!, GameStatus.WhiteVictory);
    });

    test("Should not be able to accept different offer than draw", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        whitePlayerClient.move(Square.e2, Square.e4);
        await blackPlayerClient.pull(WsTitle.Moved);
        whitePlayerClient.sendUndoOffer();
        await blackPlayerClient.pull(WsTitle.UndoOffered);

        blackPlayerClient.acceptDrawOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            whitePlayerClient.pull(WsTitle.UndoAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.UndoAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await blackPlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.DrawAcceptFailed(blackPlayerClient.lobbyId!, blackPlayerClient.player!.token),
        );
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should not be able to accept draw offer that is cancelled when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        // Cancel draw before opponent accept it.
        whitePlayerClient.sendDrawOffer();
        whitePlayerClient.cancelOffer();
        await blackPlayerClient.pull(WsTitle.OfferCancelled);

        // Should not accept after offer cancelled
        blackPlayerClient.acceptDrawOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await blackPlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.DrawAcceptFailed(whitePlayerClient.lobbyId!, blackPlayerClient.player!.token),
        );
        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should not be able to accept draw offer that is cancelled when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        // Cancel draw before opponent accept it.
        blackPlayerClient.sendDrawOffer();
        blackPlayerClient.cancelOffer();
        await whitePlayerClient.pull(WsTitle.OfferCancelled);

        // Should not accept after offer cancelled
        whitePlayerClient.acceptDrawOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.DrawAcceptFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );

        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should not be able to accept draw offer that is declined when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        // Decline draw before opponent accept it.
        blackPlayerClient.sendDrawOffer();
        await whitePlayerClient.pull(WsTitle.DrawOffered);
        whitePlayerClient.declineOffer();
        await blackPlayerClient.pull(WsTitle.OfferDeclined);

        // Should not accept after offer declined
        whitePlayerClient.acceptDrawOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.DrawAcceptFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );

        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should not be able to accept draw offer that is declined when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        // Decline draw before opponent accept it.
        whitePlayerClient.sendDrawOffer();
        await blackPlayerClient.pull(WsTitle.DrawOffered);
        blackPlayerClient.declineOffer();
        await whitePlayerClient.pull(WsTitle.OfferDeclined);

        // Should not accept after offer declined
        blackPlayerClient.acceptDrawOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await blackPlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.DrawAcceptFailed(whitePlayerClient.lobbyId!, blackPlayerClient.player!.token),
        );

        shouldNotGameFinished(whitePlayerClient.lobbyId!);
    });

    test("Should not be able to accept draw offer that is already accepted when its player's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        // Cancel draw before opponent accept it.
        blackPlayerClient.sendDrawOffer();
        await whitePlayerClient.pull(WsTitle.DrawOffered);
        whitePlayerClient.acceptDrawOffer();

        await whitePlayerClient.pull(WsTitle.DrawAccepted);
        await blackPlayerClient.pull(WsTitle.DrawAccepted);

        shouldGameStatusBe(whitePlayerClient.lobbyId!, GameStatus.Draw);

        // Should not accept after offer already accepted
        whitePlayerClient.acceptDrawOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.DrawAcceptFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );

        shouldGameStatusBe(whitePlayerClient.lobbyId!, GameStatus.Draw);
    });

    test("Should not be able to accept draw offer that is already accepted when its opponent's turn", async () => {
        const [whitePlayerClient, blackPlayerClient] =
            await createWhiteAndBlackClients();

        await playUntilDrawIsAvailable(whitePlayerClient, blackPlayerClient);

        // Cancel draw before player accept it.
        whitePlayerClient.sendDrawOffer();
        await blackPlayerClient.pull(WsTitle.DrawOffered);
        blackPlayerClient.acceptDrawOffer();

        await whitePlayerClient.pull(WsTitle.DrawAccepted);
        await blackPlayerClient.pull(WsTitle.DrawAccepted);

        shouldGameStatusBe(whitePlayerClient.lobbyId!, GameStatus.Draw);

        // Should not accept after offer already accepted
        blackPlayerClient.acceptDrawOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.DrawAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await blackPlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.DrawAcceptFailed(blackPlayerClient.lobbyId!, blackPlayerClient.player!.token),
        );

        shouldGameStatusBe(whitePlayerClient.lobbyId!, GameStatus.Draw);
    });
});

afterAll(() => {
    server?.stop(true);
});
