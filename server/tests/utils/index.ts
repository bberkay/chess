import { HTTPPostBody, HTTPRoutes, CORSResponseBody } from "src/HTTP";
import { fetch } from "bun";
import { Color, JsonNotation } from "@Chess/Types";
import { ChessEngine } from "@Chess/Engine/ChessEngine";
import { Converter } from "@Chess/Utils/Converter";

/**
 * Build a WebSocket lobby connection URL with player token.
 */
export function createWsLobbyConnUrl(
    webSocketUrl: string,
    lobbyId: string,
    playerToken: string,
): string {
    return webSocketUrl + lobbyId + "?playerToken=" + playerToken;
}

/**
 * Send an HTTP POST request to a given route and return the response.
 */
export async function testFetch<
    T extends Extract<HTTPRoutes, keyof HTTPPostBody>,
>(
    serverUrl: string,
    httpRoute: T,
    body: HTTPPostBody[T],
): Promise<CORSResponseBody<T>> {
    const createLobbyResponse = await fetch(
        serverUrl + httpRoute.replace("/", ""),
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        },
    );
    return (await createLobbyResponse.json()) as CORSResponseBody<T>;
}

/**
 * Pause for a given duration to allow WebSocket cleanup.
 */
export async function waitForWebSocketSettle(duration: number): Promise<void> {
    await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), duration);
    });
}

/**
 * Create a local chess board from FEN notation and game settings.
 */
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
