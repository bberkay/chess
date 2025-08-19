import { Square } from "@Chess/Types";
import { CORSResponseBody, HTTPPostRoutes } from "src/HTTP";
import { Player } from "src/Player";
import { WsCommand, WsDataMap, WsOutgoingMessage, WsTitle } from "src/WebSocket";
import { createWsLobbyConnUrl, testFetch } from "tests/utils";

const WS_MESSAGE_RECEIVE_TIMEOUT = 1000;
const WS_MESSAGE_RECEIVE_CHECK = 100;

export const MockClientPullErrorMsg = "Could not poll from pool.";

export abstract class MockClient {
    protected _serverUrl: string;
    protected _wsUrl: string;
    protected _ws: WebSocket | null = null;
    public lobbyId: string | null = null;
    public player: Player | null = null;
    // FIXME: Improve typing of `_incomingMessages`
    protected _incomingMessages: Record<string, unknown> = {};

    constructor(serverUrl: string, wsUrl: string) {
        this._serverUrl = serverUrl;
        this._wsUrl = wsUrl;
    }

    public async reconnectLobby(throwError: boolean = true): Promise<CORSResponseBody<HTTPPostRoutes.ReconnectLobby>> {
        if (!this.player) throw new Error("MockClient must connect before reconnect.");

        const reconnectedLobbyResponse = await testFetch(
            this._serverUrl,
            HTTPPostRoutes.ReconnectLobby,
            { lobbyId: this.lobbyId!, playerToken: this.player.token }
        );

        if (reconnectedLobbyResponse.success && reconnectedLobbyResponse.data) {
            this.lobbyId = reconnectedLobbyResponse.data.lobbyId;
            this.player = reconnectedLobbyResponse.data.player;
            const wsLobbyUrl = createWsLobbyConnUrl(this._wsUrl, this.lobbyId, this.player.token);
            await this._initWsHandlers(wsLobbyUrl);
        } else if (throwError) {
            throw new Error(`Could not reconnect lobby: ${reconnectedLobbyResponse.message}`);
        }

        return reconnectedLobbyResponse;
    }

    public async disconnectLobby(): Promise<void> {
        await this._removeWsHandlers();
    }

    protected async _initWsHandlers(wsLobbyUrl: string): Promise<void> {
        if (!this.player) throw new Error("MockClient must connect through HTTP before creating WebSocket connection.");
        if (this._ws) throw new Error("Before creating new WebSocket connection destroy the open one with `disconnectLobby()`");
        await new Promise<void>((resolve, reject) => {
            this._ws = new WebSocket(wsLobbyUrl);
            this._ws.onmessage = (event: MessageEvent) => {
                const [wsTitle, wsData] = WsCommand.parse(event.data);
                this._incomingMessages[wsTitle] = wsData;
                console.log("on message incomingMessage new title", wsTitle, wsLobbyUrl);
                if (wsTitle === WsTitle.Error) {
                    console.log("error data is: ", wsData)
                }
            }
            this._ws.onopen = () => {
                this.player!.isOnline = true;
                resolve();
            };
            setTimeout(() => reject("WebSocket instance could not handled in given time."), WS_MESSAGE_RECEIVE_TIMEOUT);
        });
    }

    protected async _removeWsHandlers(): Promise<void> {
        if (!this.player) throw new Error("MockClient must connect through HTTP before closing WebSocket connection.");
        if (!this._ws) throw new Error("No WebSocket connection found to remove its handlers.")
        return new Promise<void>((resolve, reject) => {
            this._ws!.onclose = () => {
                this.player!.isOnline = false;
                this._ws = null;
                resolve();
            }
            this._ws!.close();
            setTimeout(() => reject("WebSocket instance could not closed in given time."), WS_MESSAGE_RECEIVE_TIMEOUT);
        });
    }

    public async pull<T extends WsTitle>(wsTitle: T): Promise<WsDataMap[T]> {
        return await new Promise<WsDataMap[T]>((resolve, reject) => {
            const isReceivedInterval = setInterval(() => {
                console.log("pulling checking: ", wsTitle, this._ws?.url)
                if (Object.hasOwn(this._incomingMessages, wsTitle)) {
                    clearInterval(isReceivedInterval);
                    const data = this._incomingMessages[wsTitle];
                    delete this._incomingMessages[wsTitle];
                    // @ts-expect-error Check out FIXME of `_incomingMessages` from the top of the class
                    resolve(data);
                }
            }, WS_MESSAGE_RECEIVE_CHECK)

            setTimeout(() => {
                clearInterval(isReceivedInterval);
                reject(MockClientPullErrorMsg)
            }, WS_MESSAGE_RECEIVE_TIMEOUT);
        })
    }

    private _send(message: WsOutgoingMessage): void {
        if (!this._ws) throw new Error("No available websocket connection.");
        this._ws.send(WsCommand.create(message));
    }

    public abortGame(): void {
        this._send([WsTitle.Aborted]);
    }

    public resign(): void {
        // @ts-expect-error Since we are simulating client side
        // current WsIncomingData/WsOutgoingData types does not compatible
        // so instead of implementing client-side compatible
        // WsIncomingData/WsOutgoingData we are just going to
        // ignore to prevent unnecessary complexity.
        this._send([WsTitle.Resigned]);
    }

    public sendPlayAgainOffer(): void {
        this._send([WsTitle.PlayAgainOffered]);
    }

    public sendDrawOffer(): void {
        this._send([WsTitle.DrawOffered]);
    }

    public sendUndoOffer(): void {
        this._send([WsTitle.UndoOffered]);
    }

    public acceptDrawOffer(): void {
        this._send([WsTitle.DrawAccepted]);
    }

    public acceptPlayAgainOffer(): void {
        this._send([WsTitle.PlayAgainAccepted]);
    }

    public acceptUndoOffer(): void {
        // @ts-expect-error check out resign()
        this._send([WsTitle.UndoAccepted]);
    }

    public cancelOffer(): void {
        this._send([WsTitle.OfferCancelled]);
    }

    public declineOffer(): void {
        this._send([WsTitle.OfferDeclined]);
    }

    public move(from: Square, to: Square): void {
        this._send([WsTitle.Moved, { from, to }]);
    }
}
