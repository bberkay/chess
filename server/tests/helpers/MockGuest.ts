import { CORSResponseBody, HTTPPostBody, HTTPRoutes } from "src/HTTP";
import { MockClient } from "./MockClient";
import { createWsLobbyConnUrl, testFetch } from "tests/utils";

export class MockGuest extends MockClient {
    constructor(serverUrl: string, wsUrl: string) {
        super(serverUrl, wsUrl);
    }

    public async connectLobby(
        connectLobbyBody: HTTPPostBody[HTTPRoutes.ConnectLobby],
        throwError: boolean = true,
    ): Promise<CORSResponseBody<HTTPRoutes.ConnectLobby>> {
        const connectedLobbyResponse = await testFetch(
            this.serverUrl,
            HTTPRoutes.ConnectLobby,
            connectLobbyBody,
        );

        if (connectedLobbyResponse.success && connectedLobbyResponse.data) {
            this.lobbyId = connectedLobbyResponse.data.lobbyId;
            this.player = connectedLobbyResponse.data.player;

            const wsLobbyUrl = createWsLobbyConnUrl(
                this.wsUrl,
                this.lobbyId,
                this.player.token,
            );
            await this._initWsHandlers(wsLobbyUrl);
        } else if (throwError) {
            throw new Error(
                `Could not connect to lobby: ${connectedLobbyResponse.message}`,
            );
        }

        return connectedLobbyResponse;
    }
}
