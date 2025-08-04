import { Square } from "@Chess/Types";
import { CORSResponseBody, HTTPPostBody, HTTPPostRoutes } from "src/HTTP";
import { Player } from "src/Player";
import { WsCommand, WsDataMap, WsOutgoingMessage, WsTitle } from "src/WebSocket";
import { createWsLobbyConnUrl, testFetch } from "tests/utils";

const WS_MESSAGE_RECEIVE_TIMEOUT = 1000;
const WS_MESSAGE_RECEIVE_CHECK = 100;

export abstract class MockClient {
    protected _serverUrl: string;
    protected _wsUrl: string;
    protected _player: Player | null = null;
    protected _ws: WebSocket | null = null;
    protected _lobbyId: string | null = null;
    protected _incomingMessages: Record<string, unknown> = {};

    constructor(serverUrl: string, wsUrl: string) {
        this._serverUrl = serverUrl;
        this._wsUrl = wsUrl;
    }

    public async reconnectLobby(reconnectLobbyBody: HTTPPostBody[HTTPPostRoutes.ReconnectLobby], throwError: boolean = true): Promise<CORSResponseBody<HTTPPostRoutes.ReconnectLobby>> {
        if (!this._player) throw new Error("MockClient must connect before reconnect.");
        if (this._player.isOnline) throw new Error("MockClient already connected.");

        const reconnectedLobbyResponse = await testFetch(
            this._serverUrl,
            HTTPPostRoutes.ReconnectLobby,
            reconnectLobbyBody,
        );

        if (reconnectedLobbyResponse.success && reconnectedLobbyResponse.data) {
            this._lobbyId = reconnectedLobbyResponse.data.lobbyId;
            this._player = reconnectedLobbyResponse.data.player;
            const wsLobbyUrl = createWsLobbyConnUrl(this._wsUrl, this._lobbyId, this._player.token);
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
        if (!this._player) throw new Error("MockClient must connect through HTTP before creating WebSocket connection.");
        if (this._ws) throw new Error("Before creating new WebSocket connection destroy the open one with `disconnectLobby()`");
        await new Promise<void>((resolve, reject) => {
            this._ws = new WebSocket(wsLobbyUrl);
            this._ws.onmessage = (event: MessageEvent) => {
                const [wsTitle, wsData] = WsCommand.parse(event.data);
                this._incomingMessages[wsTitle] = wsData;
                console.log("on message incomingMessage new title", wsTitle, wsLobbyUrl);
            }
            this._ws.onopen = () => {
                this._player!.isOnline = true;
                resolve();
            };
            setTimeout(() => reject("WebSocket instance could not handled in given time."), WS_MESSAGE_RECEIVE_TIMEOUT);
        });
    }

    protected async _removeWsHandlers(): Promise<void> {
        if (!this._player) throw new Error("MockClient must connect through HTTP before closing WebSocket connection.");
        if (!this._ws) throw new Error("No WebSocket connection found to remove its handlers.")
        return new Promise<void>((resolve, reject) => {
            this._ws!.onclose = () => {
                this._player!.isOnline = false;
                this._ws = null;
                resolve();
            }
            this._ws!.close();
            setTimeout(() => reject("WebSocket instance could not closed in given time."), WS_MESSAGE_RECEIVE_TIMEOUT);
        });
    }

    public get lobbyId(): string {
        if (!this._lobbyId) throw new Error("You must create or connect to a lobby before getting lobby id");
        return this._lobbyId;
    }


    public get player(): Player {
        if (!this._player) throw new Error("You must create or connect to a lobby before getting player");
        return this._player;
    }

    public get playerWithoutToken(): Omit<Player, "token"> {
        if (!this._player) throw new Error("You must create or connect to a lobby before getting player");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { token, ...player } = this._player;
        return player;
    }

    public async pull<T extends WsTitle>(wsTitle: T): Promise<WsDataMap[T]> {
        return await new Promise<WsDataMap[T]>((resolve, reject) => {
            const isReceivedInterval = setInterval(() => {
                console.log("pulling checking: ", wsTitle, this._ws?.url)
                if (Object.hasOwn(this._incomingMessages, wsTitle)) {
                    clearInterval(isReceivedInterval);
                    const data = this._incomingMessages[wsTitle];
                    console.log("found 0504: ", data, this._ws?.url);
                    delete this._incomingMessages[wsTitle];
                    console.log("found 0504: ", this._incomingMessages[wsTitle], this._ws?.url);
                    resolve(data);
                }
            }, WS_MESSAGE_RECEIVE_CHECK)

            setTimeout(() => {
                clearInterval(isReceivedInterval);
                reject("Could not poll from pool.")
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
