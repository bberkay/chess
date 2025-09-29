import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe, beforeEach } from "vitest";
import { type Server } from "bun";
import { createLocalBoard } from "./utils";
import { pruneIPMessages, WsStartedData, WsTitle } from "@WebSocket";
import { Square } from "@Chess/Types";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { MockClient, MockClientPullErrorMsg } from "./helpers/MockClient";
import { WebSocketHandlerErrorTemplates } from "src/WebSocket/WebSocketHandlerError";
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

const playUntilFinished = async (): Promise<[MockClient, MockClient]> => {
    const creatorClient = new MockCreator(serverUrl, webSocketUrl);
    const { lobbyId } = (
        await creatorClient.createLobby({
            name: "john",
            board: "k7/8/4rp2/8/8/8/1R5K/1R6 w - - 0 1",
            remaining: 30000,
            increment: 5000,
        })
    ).data!;

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

    whitePlayerClient.move(Square.b2, Square.a2);
    await blackPlayerClient.pull(WsTitle.Moved);
    blackPlayerClient.move(Square.e6, Square.a6);
    await whitePlayerClient.pull(WsTitle.Moved);
    whitePlayerClient.move(Square.a2, Square.a6);
    await blackPlayerClient.pull(WsTitle.Moved);

    return [whitePlayerClient, blackPlayerClient];
};

describe("Play Again Tests", () => {
    test("Should be able to offer play again when the game is finished", async () => {
        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished();

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);
    });

    test("Should be able to cancel play again before accepted", async () => {
        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished();

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);

        whitePlayerClient.cancelOffer();
        await blackPlayerClient.pull(WsTitle.OfferCancelled);
    });

    test("Should be able to decline play again when the offer received", async () => {
        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished();

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);

        blackPlayerClient.declineOffer();
        await whitePlayerClient.pull(WsTitle.OfferDeclined);
    });

    test("Should not be able to accept play again if the offer is canceled before accepting it", async () => {
        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished();

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);

        whitePlayerClient.cancelOffer();
        await blackPlayerClient.pull(WsTitle.OfferCancelled);

        blackPlayerClient.acceptPlayAgainOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.PlayAgainAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.PlayAgainAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await blackPlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.PlayAgainAcceptFailed(blackPlayerClient.lobbyId!, blackPlayerClient.player!.token),
        );
    });

    test("Should not be able to accept play again if the offer is already declined.", async () => {
        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished();

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);

        blackPlayerClient.declineOffer();
        await whitePlayerClient.pull(WsTitle.OfferDeclined);

        blackPlayerClient.acceptPlayAgainOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.PlayAgainAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.PlayAgainAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await blackPlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.PlayAgainAcceptFailed(blackPlayerClient.lobbyId!, blackPlayerClient.player!.token),
        );
    });

    test("Should not be able to accept play again if the offer is already accepted.", async () => {
        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished();

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);

        blackPlayerClient.acceptPlayAgainOffer();
        await whitePlayerClient.pull(WsTitle.PlayAgainAccepted);

        blackPlayerClient.acceptPlayAgainOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.PlayAgainAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await blackPlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.PlayAgainAcceptFailed(blackPlayerClient.lobbyId!, blackPlayerClient.player!.token),
        );
    });

    test("Should not be able to accept play again offer when no play again offer has received", async () => {
        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished();

        whitePlayerClient.acceptPlayAgainOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.PlayAgainAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.PlayAgainAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.PlayAgainAcceptFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );
    });

    test("Should not be able to accept play again offer if offerer is also same player.", async () => {
        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished();

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);

        whitePlayerClient.acceptPlayAgainOffer();
        await expect(
            whitePlayerClient.pull(WsTitle.PlayAgainAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        await expect(
            blackPlayerClient.pull(WsTitle.PlayAgainAccepted),
        ).rejects.toThrow(MockClientPullErrorMsg);
        expect((await whitePlayerClient.pull(WsTitle.Error)).message).toBe(
            WebSocketHandlerErrorTemplates.PlayAgainAcceptFailed(whitePlayerClient.lobbyId!, whitePlayerClient.player!.token),
        );
    });

    test("Should be able to play again with flipped colors when the offer accepted", async () => {
        const STARTED_BOARD = "k7/8/4rp2/8/8/8/1R5K/1R6 w - - 0 1";
        const STARTED_DURATIONS = {
            remaining: 30000,
            increment: 5000,
        };

        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (
            await creatorClient.createLobby({
                name: "john",
                board: STARTED_BOARD,
                ...STARTED_DURATIONS,
            })
        ).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });

        const creatorFirstStartedData: WsStartedData = await creatorClient.pull(
            WsTitle.Started,
        );
        const guestFirstStartedData: WsStartedData = await guestClient.pull(
            WsTitle.Started,
        );

        const whitePlayerClient =
            creatorFirstStartedData.players.White.id === guestClient.player!.id
                ? guestClient
                : creatorClient;
        const blackPlayerClient =
            creatorFirstStartedData.players.Black.id === guestClient.player!.id
                ? guestClient
                : creatorClient;

        whitePlayerClient.move(Square.b2, Square.a2);
        await blackPlayerClient.pull(WsTitle.Moved);
        blackPlayerClient.move(Square.e6, Square.a6);
        await whitePlayerClient.pull(WsTitle.Moved);
        whitePlayerClient.move(Square.a2, Square.a6);
        await blackPlayerClient.pull(WsTitle.Moved);

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);
        blackPlayerClient.acceptPlayAgainOffer();
        await whitePlayerClient.pull(WsTitle.PlayAgainAccepted);

        const creatorSecondStartedData: WsStartedData =
            await creatorClient.pull(WsTitle.Started);
        const guestSecondStartedData: WsStartedData = await guestClient.pull(
            WsTitle.Started,
        );

        // Player color must be flipped before new game started.
        expect(creatorFirstStartedData).toEqual(guestFirstStartedData);
        expect(creatorSecondStartedData).toEqual(guestSecondStartedData);
        expect(creatorFirstStartedData.players.White).toEqual(
            creatorSecondStartedData.players.Black,
        );
        expect(guestFirstStartedData.players.White).toEqual(
            guestSecondStartedData.players.Black,
        );

        const awaitedBoard = createLocalBoard({
            board: STARTED_BOARD,
            ...STARTED_DURATIONS,
        });
        expect(creatorSecondStartedData!.game).toEqual(awaitedBoard);
        expect(guestSecondStartedData!.game).toEqual(awaitedBoard);
    });
});

afterAll(() => {
    server?.stop(true);
});
