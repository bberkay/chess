import { CORSResponseBody, HTTPPostBody, HTTPPostRoutes } from "src/HTTP";
import { MockClient } from "./MockClient";
import { createWsLobbyConnUrl, testFetch } from "tests/utils";

export class MockCreator extends MockClient {
    constructor(serverUrl: string, wsUrl: string) {
        super(serverUrl, wsUrl);
    }

    public async createLobby(createLobbyBody?: HTTPPostBody[HTTPPostRoutes.CreateLobby], throwError: boolean = true): Promise<CORSResponseBody<HTTPPostRoutes.CreateLobby>> {
        if (!createLobbyBody) {
            createLobbyBody = {
                name: "john",
                board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                remaining: 300000,
                increment: 5000,
            };
        }

        const createdLobbyResponse = await testFetch(
            this._serverUrl,
            HTTPPostRoutes.CreateLobby,
            createLobbyBody
        );

        if (createdLobbyResponse.success && createdLobbyResponse.data) {
            this.lobbyId = createdLobbyResponse.data.lobbyId;
            this.player = createdLobbyResponse.data.player;

            const wsLobbyUrl = createWsLobbyConnUrl(this._wsUrl, this.lobbyId, this.player.token);
            await this._initWsHandlers(wsLobbyUrl);
        } else if (throwError) {
            throw new Error(`Could not create lobby: ${createdLobbyResponse.message}`);
        }

        return createdLobbyResponse;
    }
}
