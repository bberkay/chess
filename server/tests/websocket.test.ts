import { createServer } from "src/BunServer";
import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { type Server } from "bun";
import { createWsLobbyConnUrl } from "./utils";
import { MockCreator } from "./helpers/MockCreator";
import { WebSocketHandlerErrorTemplates, WebSocketValidatorErrorTemplates, WsCommandErrorTemplates, WsTitle } from "@WebSocket";
import { INJECTION_PAYLOADS } from "./consts";

const WS_CONN_TIMEOUT = 10000;
const WS_ONOPEN = 1;
const WS_ONMESSAGE = 2;
const WS_ONCLOSE = 3;
const WS_ONERROR = 4;
const WS_TIMEOUT = -1;

let server: Server | null = null;
let serverUrl = "";
let webSocketUrl = "";

beforeAll(async () => {
    server = createServer();
    serverUrl = server.url.href;
    webSocketUrl = server.url.href.replace("http", "ws");
});

const connectToWebSocket = async (wsUrl: string, timeout: number = WS_CONN_TIMEOUT): Promise<number> => {
    timeout = timeout ?? WS_CONN_TIMEOUT
    return await new Promise<number>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        ws.onmessage = (event: MessageEvent) => {
            console.log(`Incoming message of WebSocket(${wsUrl}): ${event.data}`);
            resolve(WS_ONMESSAGE);
        }
        ws.onopen = () => {
            console.log(`WebSocket(${wsUrl}) opened.`);
            resolve(WS_ONOPEN);
        };
        ws.onclose = () => {
            console.log(`WebSocket(${wsUrl}) closed`);
            resolve(WS_ONCLOSE);
        }
        ws.onerror = () => {
            console.log(`Error for WebSocket(${wsUrl})`);
            resolve(WS_ONERROR);
        }
        setTimeout(() => reject(WS_TIMEOUT), timeout);
    });
}

describe("WebSocket Security Tests", () => {
    test("Should close the ws connection if invalid props sent while connecting to websocket", async () => {
        const urls = [
            webSocketUrl + "/?" + "someProps=123",
            ...INJECTION_PAYLOADS.map((payload) => webSocketUrl + "/?" + payload),
            createWsLobbyConnUrl(webSocketUrl, "123456", "789012"),
            ...INJECTION_PAYLOADS.map((payload) => createWsLobbyConnUrl(webSocketUrl, payload, payload)),
        ];
        for (const url of urls) {
            console.log(`Testing: ${url} .......`);
            const response = await connectToWebSocket(url);
            expect(response).toBe(WS_ONCLOSE);
        }
    });

    test("Should send error message if sent command has invalid format", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        await creatorClient.createLobby();

        // @ts-expect-error close ts error for this line
        creatorClient.send([["invalidcommand"]]);
        const payloadDirectMsg = (await creatorClient.pull(WsTitle.Error)).message;
        expect(payloadDirectMsg).toBeTruthy();
        expect(payloadDirectMsg).toBe(WsCommandErrorTemplates.InvalidFormat());
    });

    test("Should send error message if invalid command sent to websocket in WsTitle", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        await creatorClient.createLobby();

        // @ts-expect-error close ts error for this line
        creatorClient.send(["invalidcommand", { from: 32, to: 43}]);
        const payloadDirectMsg = (await creatorClient.pull(WsTitle.Error)).message;
        expect(payloadDirectMsg).toBeTruthy();
        expect(payloadDirectMsg).toBe(WsCommandErrorTemplates.InvalidCommand());
    });

    test("Should send error message if invalid command sent to websocket in WsData", async () => {
        const creatorClient = new MockCreator(serverUrl, webSocketUrl);
        await creatorClient.createLobby();

        // @ts-expect-error close ts error for this line
        creatorClient.send([WsTitle.Moved, "invalidcommand"]);
        const payloadDirectMsg = (await creatorClient.pull(WsTitle.Error)).message;
        expect(payloadDirectMsg).toBeTruthy();
        expect(payloadDirectMsg).toBe(WebSocketHandlerErrorTemplates.PlayMoveFailed(
            creatorClient.lobbyId!,
            creatorClient.player!.token,
            // @ts-expect-error since we didn't give any move the value of "from" and "to" will be "undefined" in the error message
            undefined,
            undefined
        ));
    });

    test("Should send error message if malicious command sent to websocket in WsTitle", async () => {
        const commands = INJECTION_PAYLOADS.map((payload) => [payload, { from: 32, to: 43}]);
        for (const command of commands) {
            console.log(`Testing: ${command} .......`);
            const creatorClient = new MockCreator(serverUrl, webSocketUrl);
            await creatorClient.createLobby();

            // @ts-expect-error close ts error for this line
            creatorClient.send(command);
            const payloadDirectMsg = (await creatorClient.pull(WsTitle.Error)).message;
            expect(payloadDirectMsg).toBeTruthy();
            expect(payloadDirectMsg).toBe(WsCommandErrorTemplates.InvalidCommand());
        }
    });

    test("Should send error message if malicious command sent to websocket in WsData", async () => {
        const commands = INJECTION_PAYLOADS.map((payload) => [WsTitle.Moved, payload]);
        for (const command of commands) {
            console.log(`Testing: ${command} .......`);
            const creatorClient = new MockCreator(serverUrl, webSocketUrl);
            await creatorClient.createLobby();

            // @ts-expect-error close ts error for this line
            creatorClient.send(command);
            const payloadDirectMsg = (await creatorClient.pull(WsTitle.Error)).message;
            expect(payloadDirectMsg).toBeTruthy();
            expect(payloadDirectMsg).toBe(WebSocketValidatorErrorTemplates.InvalidPayload());
        }
    });
});

afterAll(() => {
    server?.stop(true);
});
