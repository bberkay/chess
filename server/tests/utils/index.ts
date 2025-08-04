import { HTTPPostBody, HTTPResponseData, HTTPPostRoutes, CORSResponseBody } from "src/HTTP";
import { fetch } from "bun";
import { Color, JsonNotation } from "@Chess/Types";
import { ChessEngine } from "@Chess/Engine/ChessEngine";
import { Converter } from "@Chess/Utils/Converter";

export function createWsLobbyConnUrl(
    webSocketUrl: string,
    lobbyId: string,
    playerToken: string,
): string {
    return webSocketUrl + lobbyId + "?playerToken=" + playerToken;
}

export async function testFetch<
    T extends Extract<HTTPPostRoutes, keyof HTTPPostBody>,
>(
    serverUrl: string,
    httpRoute: T,
    body: HTTPPostBody[T],
): Promise<CORSResponseBody<T>> {
    const createLobbyRequest = await fetch(
        serverUrl + httpRoute.replace("/", ""),
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        },
    );

    return (await createLobbyRequest.json()) as CORSResponseBody<T>;
}

export async function reconnectToTestLobby(
    serverUrl: string,
    webSocketUrl: string,
    reconnectLobbyBody: HTTPPostBody[HTTPPostRoutes.ReconnectLobby],
): Promise<[HTTPResponseData[HTTPPostRoutes.ReconnectLobby], WebSocket]> {
    const reconnectedLobbyResponse = await testFetch(
        serverUrl,
        HTTPPostRoutes.ReconnectLobby,
        reconnectLobbyBody,
    );

    if (!reconnectedLobbyResponse.data)
        throw new Error("Could not reconnect lobby");

    const { lobbyId, user } = reconnectedLobbyResponse.data;

    const wsSocketUrl = createWebSocketUrl(webSocketUrl, lobbyId, user.id);
    const guestWs = new WebSocket(wsSocketUrl);

    await new Promise<void>((resolve) => {
        guestWs.onopen = () => {
            resolve();
        };
    });

    return [reconnectedLobbyResponse.data, guestWs];
}

export async function disconnectFromTestLobby(ws: WebSocket): Promise<void> {
    return new Promise<void>((resolve) => {
        ws.onclose = () => {
            resolve();
        };
        ws.close();
    });
}

// Wait briefly to allow WebSocket cleanup and internal state
// updates to complete.
export async function waitForWebSocketSettle(duration: number): Promise<void> {
    await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), duration);
    });
}

// Waits until a WebSocket message is received, or times out.
// Useful for testing onmessage handlers or event delivery.
export async function waitForWebSocketMessage(
    func: (
        resolve: (value: void | PromiseLike<void>) => void,
        reject: (reason?: unknown) => void,
    ) => void,
    timeout: number,
): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        func(resolve, reject);
        setTimeout(() => reject(new Error("Operation timed out")), timeout);
    });
}

export function createLocalBoard(createLobbyBody: HTTPPostBody[HTTPPostRoutes.CreateLobby]): JsonNotation {
    const chessEngine = new ChessEngine();
    const jsonBoard = Converter.fenToJson(createLobbyBody.board);
    jsonBoard.durations = {
        [Color.White]: { remaining: createLobbyBody.remaining, increment: createLobbyBody.increment },
        [Color.Black]: { remaining: createLobbyBody.remaining, increment: createLobbyBody.increment },
    };
    chessEngine.createGame(jsonBoard);
    return chessEngine.getGameAsJsonNotation();
}
