import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { createLocalBoard } from "./utils";
import { WsStartedData, WsTitle } from "src/WebSocket";
import { Square } from "@Chess/Types";
import { MockCreator } from "./helpers/MockCreator";
import { MockGuest } from "./helpers/MockGuest";
import { MockClient } from "./helpers/MockClient";

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

const playUntilFinished = async (creatorClient: MockCreator, guestClient: MockGuest): Promise<[MockClient, MockClient]> => {
    creatorClient = new MockCreator(serverUrl, webSocketUrl);
    const { lobbyId } = (await creatorClient.createLobby({
        name: "john",
        board: "k7/8/4rp2/8/8/8/1R5K/1R6 w - - 0 1",
        remaining: 30000,
        increment: 5000
    })).data!;

    guestClient = new MockGuest(serverUrl, webSocketUrl);
    await guestClient.connectLobby({ name: "alex", lobbyId });
    const startedData: WsStartedData = await guestClient.pull(WsTitle.Started);

    const whitePlayerClient = startedData.players.White.id === guestClient.player.id
        ? guestClient
        : creatorClient;
    const blackPlayerClient = startedData.players.Black.id === guestClient.player.id
        ? guestClient
        : creatorClient;

    whitePlayerClient.move(Square.b2, Square.a2);
    await blackPlayerClient.pull(WsTitle.Moved);
    blackPlayerClient.move(Square.e6, Square.a6);
    await whitePlayerClient.pull(WsTitle.Moved);
    whitePlayerClient.move(Square.a2, Square.a6);
    await blackPlayerClient.pull(WsTitle.Moved);

    return [whitePlayerClient, blackPlayerClient];
}

describe("Play Again Tests", () => {
    test("Should be able to offer play again when the game is finished", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const guestClient = new MockGuest(serverUrl, webSocketUrl);

        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished(creatorClient, guestClient);

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);
    });

    test("Should be able to play again when the offer accepted", async () => {
        const STARTED_BOARD = "k7/8/4rp2/8/8/8/1R5K/1R6 w - - 0 1";
        const STARTED_DURATIONS = {
            remaining: 30000,
            increment: 5000
        };

        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const { lobbyId } = (await creatorClient.createLobby({
            name: "john",
            board: STARTED_BOARD,
            ...STARTED_DURATIONS
        })).data!;

        const guestClient = new MockGuest(serverUrl, webSocketUrl);
        await guestClient.connectLobby({ name: "alex", lobbyId });

        const creatorFirstStartedData: WsStartedData = await creatorClient.pull(WsTitle.Started);
        const guestFirstStartedData: WsStartedData = await guestClient.pull(WsTitle.Started);

        const whitePlayerClient = creatorFirstStartedData.players.White.id === guestClient.player.id
            ? guestClient
            : creatorClient;
        const blackPlayerClient = creatorFirstStartedData.players.Black.id === guestClient.player.id
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

        const creatorSecondStartedData: WsStartedData = await creatorClient.pull(WsTitle.Started);
        const guestSecondStartedData: WsStartedData = await guestClient.pull(WsTitle.Started);

        // Player color must be flipped before new game started.
        expect(creatorFirstStartedData).toEqual(guestFirstStartedData);
        expect(creatorSecondStartedData).toEqual(guestSecondStartedData);
        expect(creatorFirstStartedData.players.White).toEqual(creatorSecondStartedData.players.Black);
        expect(guestFirstStartedData.players.White).toEqual(guestSecondStartedData.players.Black);

        const awaitedBoard = createLocalBoard({
            name: "isBoardCorrect",
            board: STARTED_BOARD,
            ...STARTED_DURATIONS
        });
        expect(creatorSecondStartedData!.game).toEqual(awaitedBoard);
        expect(guestSecondStartedData!.game).toEqual(awaitedBoard);
    });

    test("Should be able to cancel play again before accepted", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const guestClient = new MockGuest(serverUrl, webSocketUrl);

        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished(creatorClient, guestClient);

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);

        whitePlayerClient.cancelOffer();
        await blackPlayerClient.pull(WsTitle.OfferCancelled);
    });

    test("Should be able to decline play again when the offer received", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const guestClient = new MockGuest(serverUrl, webSocketUrl);

        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished(creatorClient, guestClient);

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);

        blackPlayerClient.declineOffer();
        await whitePlayerClient.pull(WsTitle.OfferDeclined);
    });

    test("Should not be able to accept play again if the offer is canceled before accepting it", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const guestClient = new MockGuest(serverUrl, webSocketUrl);

        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished(creatorClient, guestClient);

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);

        whitePlayerClient.cancelOffer();
        await blackPlayerClient.pull(WsTitle.OfferCancelled);

        blackPlayerClient.acceptPlayAgainOffer();
        await expect(whitePlayerClient.pull(WsTitle.PlayAgainAccepted)).rejects.toThrow("Could not poll from pool.");
    });

    test("Should not be able to accept play again if the offer is already declined.", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const guestClient = new MockGuest(serverUrl, webSocketUrl);

        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished(creatorClient, guestClient);

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);

        blackPlayerClient.declineOffer();
        await whitePlayerClient.pull(WsTitle.OfferDeclined);

        blackPlayerClient.acceptPlayAgainOffer();
        await expect(whitePlayerClient.pull(WsTitle.PlayAgainAccepted)).rejects.toThrow("Could not poll from pool.");
    });

    test("Should not be able to accept play again if the offer is already accepted.", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        const guestClient = new MockGuest(serverUrl, webSocketUrl);

        const [whitePlayerClient, blackPlayerClient] = await playUntilFinished(creatorClient, guestClient);

        whitePlayerClient.sendPlayAgainOffer();
        await blackPlayerClient.pull(WsTitle.PlayAgainOffered);

        blackPlayerClient.acceptPlayAgainOffer();
        await whitePlayerClient.pull(WsTitle.PlayAgainAccepted);

        blackPlayerClient.acceptPlayAgainOffer();
        await expect(whitePlayerClient.pull(WsTitle.PlayAgainAccepted)).rejects.toThrow("Could not poll from pool.");
    });

});

afterAll(() => {
    server?.stop(true);
});
