import type { Server } from "bun";
import type {
    CreateLobbyReqParams,
    JoinLobbyReqParams,
    ReconnectLobbyReqParams,
    WebSocketData,
    WebSocketReqParams,
    BaseWebSocketReqParams,
    CreatedLobbyData,
    JoinedLobbyData,
    ReconnectedLobbyData,
    LobbyData
} from "./Types";
import { LobbyManager } from "./Managers/LobbyManager";
import {
    createRandomId,
    isValidLength,
    isInRange,
    updateKeys,
} from "./Utils/helper.utils";
import { CORS_HEADERS, MAX_IDLE_TIMEOUT, MAX_PAYLOAD_LENGTH, SERVER_PORT } from "./Consts";
import {
    GU_ID_LENGTH,
    MAX_PLAYER_NAME_LENGTH,
    MIN_PLAYER_NAME_LENGTH,
    MAX_TOTAL_TIME,
    MIN_TOTAL_TIME,
    MAX_INCREMENT_TIME,
    MIN_INCREMENT_TIME,
} from "./Consts";
import { LobbyController } from "./Controllers/LobbyController";

/**
 * Response class with CORS headers.
 */
class CORSResponse extends Response {
    constructor(body: BodyInit | null, init?: ResponseInit) {
        super(body, init);
        for (const key in CORS_HEADERS) {
            this.headers.set(key, CORS_HEADERS[key]);
        }
    }
}

/**
 * Handles the initial WebSocket connection request, including validation and parameter parsing.
 */
class WebSocketRequestHandler {
    private _req: Request;

    constructor(req: Request) {
        this._req = req;
    }

    /**
     * Validates individual parameters of a WebSocket request.
     */
    public validateValues(params: BaseWebSocketReqParams): CORSResponse | boolean {
        const validations: Record<string, boolean> = {
            name:
                params.name === "" ||
                isInRange(
                    params.name.length,
                    MIN_PLAYER_NAME_LENGTH,
                    MAX_PLAYER_NAME_LENGTH
                ),
            lobbyId:
                params.lobbyId === "" ||
                (isValidLength(params.lobbyId, GU_ID_LENGTH) &&
                    LobbyManager.isLobbyExist(params.lobbyId)),
            token: params.token === "" || isValidLength(params.token, GU_ID_LENGTH),
            board: params.board === "" || params.board.length <= 100,
            remaining:
                params.remaining === "" ||
                isInRange(
                    parseInt(params.remaining as string),
                    MIN_TOTAL_TIME,
                    MAX_TOTAL_TIME
                ),
            increment:
                params.increment === "" ||
                isInRange(
                    parseInt(params.increment as string),
                    MIN_INCREMENT_TIME,
                    MAX_INCREMENT_TIME
                ),
        };
        console.log("Validations: ", validations);

        const errors: Record<string, string> = {
            name: `Invalid request. "playerName" length must be between ${MIN_PLAYER_NAME_LENGTH} and ${MAX_PLAYER_NAME_LENGTH}.`,
            lobbyId: `Invalid request. "lobbyId" length must be ${GU_ID_LENGTH} length and lobby must be exist.`,
            token: `Invalid request. "token" length must be ${GU_ID_LENGTH}.`,
            board: `Invalid request. "board" length must be less than 100.`,
            remaining: `Invalid request. "remaining" must be a number between ${MIN_TOTAL_TIME} and ${MAX_TOTAL_TIME}.`,
            increment: `Invalid request. "increment" must be a number between ${MIN_INCREMENT_TIME} and ${MAX_INCREMENT_TIME}.`,
        };

        for (const key in validations) {
            if (!validations[key])
                return new CORSResponse(errors[key], { status: 400 });
        }

        return true;
    }

    /**
     * Ensures that certain parameters are not used
     * together and that required combinations are
     * present.
     */
    public validateCombination(
        params: BaseWebSocketReqParams
    ): CORSResponse | boolean {
        if (params.name && params.token)
            return new CORSResponse(
                `Invalid request. "name" and "token" cannot be used together.`,
                { status: 400 }
            );

        if (!params.name && !params.token)
            return new CORSResponse(
                `Invalid request. "name" or "token" must be provided.`,
                { status: 400 }
            );

        if (params.token && !params.lobbyId)
            return new CORSResponse(
                `Invalid request. "token" must be used with "lobbyId".`,
                { status: 400 }
            );

        if (
            (params.board || params.remaining || params.increment) &&
            (!params.name || params.lobbyId || params.token)
        )
            return new CORSResponse(
                `Invalid request. "board", "remaining", "increment" can only be used when creating a new lobby.`,
                { status: 400 }
            );

        if (
            params.name &&
            !params.lobbyId &&
            (!params.board || !params.remaining || !params.increment)
        )
            return new CORSResponse(
                `Invalid request. "board", "remaining", "increment" must be provided when creating a new lobby.`,
                { status: 400 }
            );

        return true;
    }

    /**
     * Determines the specific type of WebSocket request
     * based on the provided parameters.
     */
    public findWebSocketReqParams(
        params: BaseWebSocketReqParams
    ): CORSResponse | WebSocketReqParams {
        if (params.name && params.board && params.remaining && params.increment)
            return {
                name: params.name,
                board: params.board,
                remaining: params.remaining,
                increment: params.increment,
            } as CreateLobbyReqParams;

        if (params.name && params.lobbyId)
            return {
                name: params.name,
                lobbyId: params.lobbyId,
            } as JoinLobbyReqParams;

        if (params.token && params.lobbyId)
            return {
                token: params.token,
                lobbyId: params.lobbyId,
            } as ReconnectLobbyReqParams;

        return new CORSResponse("Invalid request.", { status: 400 });
    }

    /**
     * This function combines individual parameter validation,
     * combination validation, and request type determination.
     */
    public isParametersValid(req: Request): CORSResponse | WebSocketReqParams {
        const url = new URL(req.url);
        const params: BaseWebSocketReqParams = {
            name: url.searchParams.get("name") || "",
            lobbyId: url.searchParams.get("lobbyId") || "",
            token: url.searchParams.get("token") || "",
            board: url.searchParams.get("board") || "",
            remaining: url.searchParams.get("remaining") || "",
            increment: url.searchParams.get("increment") || "",
        };
        console.log("Params: ", JSON.stringify(params));
        let validation = this.validateValues(params);
        if (validation instanceof CORSResponse) return validation;

        validation = this.validateCombination(params);
        if (validation instanceof CORSResponse) return validation;

        const webSocketReqParams = this.findWebSocketReqParams(params);
        if (webSocketReqParams instanceof CORSResponse) return webSocketReqParams;

        return webSocketReqParams;
    }

    /**
     * Parse the needed data for the creating of the lobby.
     */
    public createLobbyAndGetLobbyJoiningData(
        createLobbyReqParams: CreateLobbyReqParams
    ): CORSResponse | CreatedLobbyData {
        try {
            const lobbyId = LobbyManager.createLobby(createLobbyReqParams.board, {
                remaining:
                    typeof createLobbyReqParams.remaining === "string"
                        ? parseInt(createLobbyReqParams.remaining)
                        : createLobbyReqParams.remaining,
                increment:
                    typeof createLobbyReqParams.increment === "string"
                        ? parseInt(createLobbyReqParams.increment)
                        : createLobbyReqParams.increment,
            });

            return { lobbyId, token: createRandomId(GU_ID_LENGTH) };
        } catch (e: unknown) {
            return new CORSResponse(
                e instanceof Error
                    ? e.message
                    : "An error occured while handling the parameters.",
                { status: 500 }
            );
        }
    }

    /**
     * Parse the needed data for the joining to the lobby.
     */
    public getLobbyJoiningData(
        joinLobbyReqParams: JoinLobbyReqParams
    ): CORSResponse | JoinedLobbyData {
        const lobby = LobbyManager.getLobby(joinLobbyReqParams.lobbyId);
        if (!lobby) return new Response("Lobby not found.", { status: 404 });

        if (lobby.isGameStarted())
            return new Response("Lobby is already started to play.", {
                status: 400,
            });

        return {
            lobbyId: joinLobbyReqParams.lobbyId,
            token: createRandomId(
                GU_ID_LENGTH,
                lobby.getWhitePlayer()?.token || lobby.getBlackPlayer()?.token
            ),
        };
    }

    /**
     * Parse the needed data for the reconnecting to the lobby.
     */
    public getReconnectingLobbyData(
        reconnectLobbyReqParams: ReconnectLobbyReqParams
    ): CORSResponse | ReconnectedLobbyData {
        const lobby = LobbyManager.getLobby(reconnectLobbyReqParams.lobbyId);
        if (!lobby) return new CORSResponse("Lobby not found.", { status: 404 });

        const name = lobby.getTokenName(reconnectLobbyReqParams.token);
        const id = lobby.getTokenId(reconnectLobbyReqParams.token);
        if (!name || !id)
            return new CORSResponse("Invalid user token.", { status: 401 });
        if (lobby.isTokenOnline(reconnectLobbyReqParams.token))
            return new CORSResponse("User is already online.", { status: 400 });

        return { lobbyId: reconnectLobbyReqParams.lobbyId, name, id };
    }

    /**
     * Handles the incoming WebSocket request parameters.
     * This function handles the entire process of validating and
     * processing the request parameters.
     */
    public handle(): CORSResponse | LobbyData {
        try {
            const params = this.isParametersValid(this._req);
            if (params instanceof CORSResponse) return params;

            let neededParams: LobbyData = updateKeys({ lobbyId: "", token: "", name: "", id: "" }, params);
            if ((params as CreateLobbyReqParams).board !== undefined)
                neededParams = updateKeys(
                    neededParams,
                    this.createLobbyAndGetLobbyJoiningData(params as CreateLobbyReqParams)
                );
            else if ((params as ReconnectLobbyReqParams).token !== undefined)
                neededParams = updateKeys(
                    neededParams,
                    this.getReconnectingLobbyData(params as ReconnectLobbyReqParams)
                );
            else if ((params as JoinLobbyReqParams).lobbyId !== undefined)
                neededParams = updateKeys(
                    neededParams,
                    this.getLobbyJoiningData(params as JoinLobbyReqParams)
                );

            return neededParams;
        } catch (e: unknown) {
            return new CORSResponse(
                e instanceof Error
                    ? e.message
                    : "An error occured while handling the parameters.",
                { status: 500 }
            );
        }
    }
}

/**
 * Handles standard HTTP GET requests.
 */
class HTTPRequestHandler {
    private _req: Request;

    constructor(req: Request) {
        this._req = req;
    }

    /**
     * Processes the HTTP request and returns an appropriate response.
     */
    public handle(): CORSResponse {
        if (this._req.method !== "GET")
            return new CORSResponse("Only GET method is allowed.", { status: 405 });

        if (this._req.url === "/")
            return new CORSResponse("Chess server is running.", { status: 200 });

        const url = new URL(this._req.url);

        // Parameters:
        if (url.searchParams.has("lobbyId")) {
            const lobbyId = url.searchParams.get("lobbyId") as string;
            if (LobbyManager.isLobbyExist(lobbyId)) {
                return new CORSResponse("Lobby is exist.", { status: 200 });
            } else {
                return new CORSResponse("Lobby not found.", { status: 404 });
            }
        }

        return new CORSResponse("Invalid request.", { status: 400 });
    }
}

/**
 * Checks if the request is a standard HTTP request.
 */
function isHttpRequest(req: Request): boolean {
    return req.headers.get("upgrade") === null;
}

/**
 * Checks if the request is a WebSocket upgrade request.
 */
function isWebSocketRequest(req: Request): boolean {
    return req.headers.get("upgrade") === "websocket";
}

/**
 * Initializes and starts the Bun server with WebSocket and HTTP support.
 */
export function createServer(): Server {
    const lobbyController = new LobbyController();
    const server = Bun.serve<WebSocketData>({
        port: SERVER_PORT,
        fetch(req: Request, server: Server) {
            if (isHttpRequest(req)) {
                const reqHandler = new HTTPRequestHandler(req);
                return reqHandler.handle();
            }

            if (!isWebSocketRequest(req)) {
                return new CORSResponse(
                    "Only websocket or http GET requests are allowed.",
                    { status: 400 }
                );
            }

            const reqHandler = new WebSocketRequestHandler(req);
            const response = reqHandler.handle();

            if (response instanceof CORSResponse)
                return response;

            const { lobbyId, token, name, id } = response;

            // upgrade the connection.
            const success = server.upgrade(req, {
                data: {
                    lobbyId: lobbyId,
                    player: {
                        name: name,
                        token: token,
                        id: id,
                        isOnline: true,
                    },
                },
            });
            if (success) {
                lobbyController.upgradeServer(server);
                return;
            }

            return undefined;
        },
        websocket: {
            ...lobbyController.expose(),
            maxPayloadLength: MAX_PAYLOAD_LENGTH,
            idleTimeout: MAX_IDLE_TIMEOUT,
        },
    });

    console.log(`Listening on http://localhost:${server.port} ...`);
    return server;
}
