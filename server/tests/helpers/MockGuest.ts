import { CORSResponseBody, HTTPPostBody, HTTPPostRoutes } from "src/HTTP";
import { MockClient } from "./MockClient";
import { createWsLobbyConnUrl, testFetch } from "tests/utils";

export class MockGuest extends MockClient {
    constructor(serverUrl: string, wsUrl: string) {
        super(serverUrl, wsUrl);
    }

    public async connectLobby(connectLobbyBody: HTTPPostBody[HTTPPostRoutes.ConnectLobby], throwError: boolean = true): Promise<CORSResponseBody<HTTPPostRoutes.ConnectLobby>> {
        if (this._player && this._player.isOnline) {
            console.warn("Closing current connection before connecting to new lobby...");
            await this.disconnectLobby();
        }

        const connectedLobbyResponse = await testFetch(
            this._serverUrl,
            HTTPPostRoutes.ConnectLobby,
            connectLobbyBody,
        );

        if (connectedLobbyResponse.success && connectedLobbyResponse.data) {
            this._lobbyId = connectedLobbyResponse.data.lobbyId;
            this._player = connectedLobbyResponse.data.player;

            const wsLobbyUrl = createWsLobbyConnUrl(this._wsUrl, this._lobbyId, this._player.token);
            await this._initWsHandlers(wsLobbyUrl);
        } else if (throwError) {
            throw new Error(`Could not connect to lobby: ${connectedLobbyResponse.message}`);
        }

        return connectedLobbyResponse;
    }
}
