import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { isValidLength } from "@Utils";
import {
    GU_ID_LENGTH,
} from "@Consts";
import { HTTPPostRoutes, HTTPPostBody, HTTPRequestValidatorErrorTemplates } from "src/HTTP";
import { MockCreator } from "./helpers/MockCreator";
import { WsConnectedData, WsTitle } from "@WebSocket";
import { INJECTION_PAYLOADS } from "./consts";

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

const shouldCreate = async (body: HTTPPostBody[HTTPPostRoutes.CreateLobby]) => {
    const creatorClient = new MockCreator(serverUrl, webSocketUrl);
    const createdLobbyResponse = await creatorClient.createLobby(body);
    expect(createdLobbyResponse.success).toBe(true);
    expect(createdLobbyResponse.data).toBeTruthy();

    expect(isValidLength(creatorClient.lobbyId, GU_ID_LENGTH)).toBe(true);

    expect(creatorClient.player).toBeTruthy();
    expect(isValidLength(creatorClient.player.id, GU_ID_LENGTH)).toBe(true);
    expect(isValidLength(creatorClient.player.token, GU_ID_LENGTH)).toBe(true);
    expect(creatorClient.player.name).toBe("john");
    expect(creatorClient.player.isOnline).toBe(true);

    const creatorConnectedData: WsConnectedData = await creatorClient.pull(WsTitle.Connected);
    expect(creatorConnectedData!.playerId).toEqual(creatorClient.player.id);
}

const shouldNotCreate = async (body: HTTPPostBody[HTTPPostRoutes.CreateLobby], errMsg?: string) => {
    const creatorClient = new MockCreator(serverUrl, webSocketUrl);
    const createdLobbyResponse = await creatorClient.createLobby(body, false);
    expect(createdLobbyResponse.success).toBe(false);
    if (errMsg) expect(createdLobbyResponse.message).toBe(errMsg);
}

describe("Create Lobby Tests", () => {
    test("Should create a lobby and receive necessery data via HTTP request", async () => {
        await shouldCreate({
            name: "john",
            board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            remaining: 300000,
            increment: 5000,
        });
    });

    test("Should not create a lobby when name is empty", async () => {
        await shouldNotCreate({
            name: "",
            board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            remaining: 300000,
            increment: 5000
        }, HTTPRequestValidatorErrorTemplates.InvalidNameLength());
    });

    test("Should not create a lobby when name is too long", async () => {
        await shouldNotCreate({
            name: "johnnnnnnnnnnnnnnnnnnnnnnnnnnn",
            board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            remaining: 300000,
            increment: 5000
        }, HTTPRequestValidatorErrorTemplates.InvalidNameLength());
    });

    test("Should not create a lobby on injection attempts in name", async () => {
        for (const payload of INJECTION_PAYLOADS) {
            await shouldNotCreate({
                name: payload,
                board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                remaining: 300000,
                increment: 5000,
            }, HTTPRequestValidatorErrorTemplates.InvalidName());
        }
    });

    test("Should not create a lobby when board is invalid", async () => {
        await shouldNotCreate({
            name: "john",
            board: "rnbYkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            remaining: 300000,
            increment: 5000
        }, HTTPRequestValidatorErrorTemplates.InvalidBoard());
    });

    test("Should not create a lobby when board is empty", async () => {
        await shouldNotCreate({
            name: "alex",
            board: "",
            remaining: 300000,
            increment: 5000
        }, HTTPRequestValidatorErrorTemplates.InvalidBoardLength());
    });

    test("Should not create a lobby on injection attempts in board", async () => {
        for (const payload of INJECTION_PAYLOADS) {
            await shouldNotCreate({
                name: payload,
                board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                remaining: 300000,
                increment: 5000,
            }, HTTPRequestValidatorErrorTemplates.InvalidBoard());
        }
    });

    test("Should not create a lobby when board is too short", async () => {
        await shouldNotCreate({
            name: "john",
            board: "rnbqkbnr/ppp",
            remaining: 300000,
            increment: 5000
        }, HTTPRequestValidatorErrorTemplates.InvalidBoardLength());
    });

    test("Should not create a lobby when board is too long", async () => {
        await shouldNotCreate({
            name: "john",
            board: "rnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppprnbqkbnr/ppp",
            remaining: 300000,
            increment: 5000
        }, HTTPRequestValidatorErrorTemplates.InvalidBoardLength());
    });

    test("Should not create a lobby when remaining is non-numeric", async () => {
        await shouldNotCreate({
            name: "john",
            board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            // @ts-expect-error for testing
            remaining: "abc",
            increment: 5000
        }, HTTPRequestValidatorErrorTemplates.InvalidRemainingValue());
    });

    test("Should not create a lobby when remaining is too big", async () => {
        await shouldNotCreate({
            name: "john",
            board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            remaining: 300000000000,
            increment: 5000
        }, HTTPRequestValidatorErrorTemplates.InvalidRemainingValue());
    });

    test("Should not create a lobby when remaining is zero", async () => {
        await shouldNotCreate({
            name: "john",
            board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            remaining: 0,
            increment: 5000
        }, HTTPRequestValidatorErrorTemplates.InvalidRemainingValue());
    });

    test("Should not create a lobby when remaining is negative", async () => {
        await shouldNotCreate({
            name: "john",
            board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            remaining: -300000,
            increment: 5000
        }, HTTPRequestValidatorErrorTemplates.InvalidRemainingValue());
    });

    test("Should not create a lobby when increment is non-numeric", async () => {
        await shouldNotCreate({
            name: "john",
            board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            remaining: 300000,
            // @ts-expect-error for testing
            increment: "abc"
        }, HTTPRequestValidatorErrorTemplates.InvalidIncrementValue());
    });

    test("Should not create a lobby when increment is too big", async () => {
        await shouldNotCreate({
            name: "john",
            board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            remaining: 300000,
            increment: 50000000000000,
        }, HTTPRequestValidatorErrorTemplates.InvalidIncrementValue());
    });

    test("Should create a lobby when increment is zero", async () => {
        await shouldCreate({
            name: "john",
            board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            remaining: 300000,
            increment: 0,
        });
    });

    test("Should not create a lobby when increment is negative", async () => {
        await shouldNotCreate({
            name: "john",
            board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            remaining: 300000,
            increment: -5000,
        }, HTTPRequestValidatorErrorTemplates.InvalidIncrementValue());
    });

    // TODO: Special name
});

afterAll(() => {
    server?.stop(true);
});
