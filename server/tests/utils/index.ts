import { HTTPPostBody, HTTPRoutes, CORSResponseBody } from "src/HTTP";
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
    T extends Extract<HTTPRoutes, keyof HTTPPostBody>,
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

// Wait briefly to allow WebSocket cleanup and internal state
// updates to complete.
export async function waitForWebSocketSettle(duration: number): Promise<void> {
    await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), duration);
    });
}

export function createLocalBoard(createLobbyBody: { board: string, remaining: number, increment: number }): JsonNotation {
    const chessEngine = new ChessEngine();
    const jsonBoard = Converter.fenToJson(createLobbyBody.board);
    jsonBoard.durations = {
        [Color.White]: { remaining: createLobbyBody.remaining, increment: createLobbyBody.increment },
        [Color.Black]: { remaining: createLobbyBody.remaining, increment: createLobbyBody.increment },
    };
    chessEngine.createGame(jsonBoard);
    return chessEngine.getGameAsJsonNotation();
}
