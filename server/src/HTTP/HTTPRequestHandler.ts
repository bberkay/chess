import type { BunRequest } from "bun";
import { HTTPGetRoutes, HTTPPostRoutes, HTTPRequestHandlerError } from ".";
import { CORSResponse } from "./CORSResponse";
import { LobbyRegistry } from "@Lobby";
import { PlayerRegistry } from "@Player";
import {
    HTTPGetRequestValidator,
    HTTPPostRequestValidator,
} from "./HTTPRequestValidator";
import { createResponseFromHTTPError } from "./utils";

/**
 * A GET request handler interface with a single GET method.
 */
type GETHandler<T extends HTTPGetRoutes> = {
    GET: (req: BunRequest<T>) => CORSResponse<T>;
};

/**
 * A RESTful request handler interface with GET, OPTIONS, and POST methods.
 */
type RESTHandler<T extends HTTPPostRoutes> = {
    GET: (req: BunRequest<T>) => CORSResponse<HTTPGetRoutes.Root>;
    OPTIONS: (req: BunRequest<T>) => CORSResponse<HTTPGetRoutes.Root>;
    POST: (req: BunRequest<T>) => Promise<CORSResponse<T>>;
};

/**
 * Defines all available HTTP route handlers mapped to their implementations.
 */
export interface AvailableHTTPRequests {
    [HTTPGetRoutes.Root]: CORSResponse<HTTPGetRoutes.Root>;
    [HTTPGetRoutes.Health]: CORSResponse<HTTPGetRoutes.Health>;
    [HTTPGetRoutes.CheckLobby]: GETHandler<HTTPGetRoutes.CheckLobby>;
    [HTTPPostRoutes.CreateLobby]: RESTHandler<HTTPPostRoutes.CreateLobby>;
    [HTTPPostRoutes.ConnectLobby]: RESTHandler<HTTPPostRoutes.ConnectLobby>;
    [HTTPPostRoutes.ReconnectLobby]: RESTHandler<HTTPPostRoutes.ReconnectLobby>;
}

/**
 * Handles all incoming HTTP requests by routing them to the correct handler
 * based on the HTTP method and route.
 */
export class HTTPRequestHandler {
    /**
     * Handles the root GET request.
     * Used for displaying server availability.
     */
    private _root(): AvailableHTTPRequests[HTTPGetRoutes.Root] {
        return new CORSResponse({
            success: true,
            message: "Chess server is running.",
        });
    }

    /**
     * Handles the /health GET request.
     * Used as a health check endpoint.
     */
    private _health(): AvailableHTTPRequests[HTTPGetRoutes.Health] {
        return new CORSResponse({
            success: true,
            message: "OK",
        });
    }

    /**
     * Handles the /check-lobby GET request.
     * Validates the lobbyId and returns whether the lobby exists.
     */
    private _checkLobby(): AvailableHTTPRequests[HTTPGetRoutes.CheckLobby] {
        return {
            GET: (req) => {
                try {
                    const lobbyId = req.params.lobbyId;

                    HTTPGetRequestValidator.validate(
                        HTTPGetRoutes.CheckLobby,
                        req,
                    );

                    const isLobbyFound = LobbyRegistry.check(
                        lobbyId
                    );

                    if (!isLobbyFound) {
                        return new CORSResponse(
                            {
                                success: false,
                                message: HTTPRequestHandlerError.factory.LobbyNotFound(lobbyId).message,
                            },
                            { status: 404 },
                        );
                    }

                    return new CORSResponse(
                        { success: true, message: "Lobby found", data: true },
                        { status: 200 },
                    );
                } catch (e: unknown) {
                    return createResponseFromHTTPError(e, HTTPRequestHandlerError.factory.UnexpectedErrorWhileCheckingLobby())
                }
            },
        };
    }

    /**
     * Handles the /create-lobby endpoint for GET, OPTIONS, and POST.
     * POST: Creates a new lobby and player.
     */
    private _createLobby(): AvailableHTTPRequests[HTTPPostRoutes.CreateLobby] {
        return {
            GET: () => new CORSResponse({ success: false, message: "NO" }),
            OPTIONS: (req) =>
                new CORSResponse(
                    { success: true, message: "OK" },
                    { status: 204, headers: req.headers },
                ),
            POST: async (req) => {
                try {
                    const body =
                        await HTTPPostRequestValidator.parseAndValidate(
                            HTTPPostRoutes.CreateLobby,
                            req,
                        );

                    const lobbyId = LobbyRegistry.create(body.board, {
                        remaining: body.remaining,
                        increment: body.increment,
                    });

                    const player = PlayerRegistry.create(body.name);
                    return new CORSResponse(
                        {
                            success: true,
                            message:
                                "Lobby created and connected successfully.",
                            data: { player, lobbyId },
                        },
                        { status: 200 },
                    );
                } catch (e: unknown) {
                    return createResponseFromHTTPError(e, HTTPRequestHandlerError.factory.UnexpectedErrorWhileCreatingLobby())
                }
            },
        };
    }

    /**
     * Handles the /connect-lobby endpoint for GET, OPTIONS, and POST.
     * POST: Connects a player to an existing lobby.
     */
    private _connectLobby(): AvailableHTTPRequests[HTTPPostRoutes.ConnectLobby] {
        return {
            GET: () => new CORSResponse({ success: false, message: "NO" }),
            OPTIONS: (req) =>
                new CORSResponse(
                    { success: true, message: "OK" },
                    { status: 204, headers: req.headers },
                ),
            POST: async (req) => {
                try {
                    const body =
                        await HTTPPostRequestValidator.parseAndValidate(
                            HTTPPostRoutes.ConnectLobby,
                            req,
                        );

                    const lobby = LobbyRegistry.get(body.lobbyId);
                    if (!lobby) {
                        return new CORSResponse(
                            {
                                success: false,
                                message: HTTPRequestHandlerError.factory.LobbyNotFound(body.lobbyId).message,
                            },
                            { status: 404 },
                        );
                    }

                    if (lobby.isGameStarted()) {
                        return new CORSResponse(
                            {
                                success: false,
                                message: HTTPRequestHandlerError.factory.LobbyAlreadyStarted(body.lobbyId).message,
                            },
                            { status: 403 },
                        );
                    }

                    if (lobby.areBothPlayersOnline()) {
                        return new CORSResponse(
                            {
                                success: false,
                                message: HTTPRequestHandlerError.factory.LobbyFull(body.lobbyId).message,
                            },
                            { status: 403 },
                        );
                    }

                    const player = PlayerRegistry.create(body.name);
                    return new CORSResponse(
                        {
                            success: true,
                            message: "Connected to the lobby successfully.",
                            data: { player, lobbyId: body.lobbyId },
                        },
                        { status: 200 },
                    );
                } catch (e: unknown) {
                    return createResponseFromHTTPError(e, HTTPRequestHandlerError.factory.UnexpectedErrorWhileConnectingLobby())
                }
            },
        };
    }

    /**
     * Handles the /reconnect-lobby endpoint for GET, OPTIONS, and POST.
     * POST: Reconnects an offline player to their lobby if eligible.
     */
    private _reconnectLobby(): AvailableHTTPRequests[HTTPPostRoutes.ReconnectLobby] {
        return {
            GET: () => new CORSResponse({ success: false, message: "NO" }),
            OPTIONS: (req) =>
                new CORSResponse(
                    { success: true, message: "OK" },
                    { status: 204, headers: req.headers },
                ),
            POST: async (req) => {
                try {
                    const body =
                        await HTTPPostRequestValidator.parseAndValidate(
                            HTTPPostRoutes.ReconnectLobby,
                            req,
                        );

                    const lobby = LobbyRegistry.get(body.lobbyId);
                    if (!lobby) {
                        return new CORSResponse(
                            {
                                success: false,
                                message: HTTPRequestHandlerError.factory.LobbyNotFound(body.lobbyId).message,
                            },
                            { status: 404 },
                        );
                    }

                    const player = PlayerRegistry.get(body.playerToken);
                    if (!player) {
                        return new CORSResponse(
                            {
                                success: false,
                                message: HTTPRequestHandlerError.factory.PlayerNotFound(body.playerToken).message,
                            },
                            { status: 401 },
                        );
                    }

                    if (!lobby.isPlayerInLobby(player)) {
                        return new CORSResponse(
                            {
                                success: false,
                                message: HTTPRequestHandlerError.factory.PlayerNotInLobby(body.lobbyId, body.playerToken).message,
                            },
                            { status: 403 },
                        );
                    }

                    if (player.isOnline) {
                        return new CORSResponse(
                            {
                                success: false,
                                message: HTTPRequestHandlerError.factory.PlayerAlreadyOnline(body.lobbyId, body.playerToken).message,
                            },
                            { status: 400 },
                        );
                    }

                    return new CORSResponse(
                        {
                            success: true,
                            message: "Reconnected to the lobby successfully.",
                            data: { player, lobbyId: body.lobbyId },
                        },
                        { status: 200 },
                    );
                } catch (e: unknown) {
                    return createResponseFromHTTPError(e, HTTPRequestHandlerError.factory.UnexpectedErrorWhileReconnectingLobby())
                }
            },
        };
    }

    /**
     * Exposes all HTTP request handlers mapped by their corresponding routes.
     *
     * @returns A mapping of all available HTTP routes to their handlers.
     */
    public expose(): AvailableHTTPRequests {
        return {
            [HTTPGetRoutes.Root]: this._root(),
            [HTTPGetRoutes.Health]: this._health(),
            [HTTPGetRoutes.CheckLobby]: this._checkLobby(),
            [HTTPPostRoutes.CreateLobby]: this._createLobby(),
            [HTTPPostRoutes.ConnectLobby]: this._connectLobby(),
            [HTTPPostRoutes.ReconnectLobby]: this._reconnectLobby(),
        };
    }

    /**
     * Checks whether the given request is a plain HTTP request
     * (i.e., not a WebSocket upgrade).
     *
     * @param req - The incoming Request object.
     * @returns True if the request is an HTTP request; false otherwise.
     */
    public canHandle(req: Request): boolean {
        return req.headers.get("upgrade") === null;
    }
}
