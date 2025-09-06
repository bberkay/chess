import type { BunRequest, Server } from "bun";
import { HTTPRoutes, HTTPRequestHandlerError, rateLimiter } from ".";
import { CORSResponse } from "./CORSResponse";
import { LobbyRegistry } from "@Lobby";
import { PlayerRegistry } from "@Player";
import {
    HTTPGetRequestValidator,
    HTTPPostRequestValidator,
} from "./HTTPRequestValidator";
import { createResponseFromHTTPError } from "./utils";

/**
 * A RESTful request handler interface with GET, OPTIONS, and POST methods.
 * Each method takes a typed request and returns a CORSResponse,
 * with POST optionally supporting async behavior.
 */
interface RESTScheme<T extends HTTPRoutes> {
    GET: (req: BunRequest<T>, server: Server) => CORSResponse<T>;
    OPTIONS?: (req: BunRequest<T>, server: Server) => CORSResponse<T>;
    POST?: (req: BunRequest<T>, server: Server) => Promise<CORSResponse<T>>;
}

/**
 * Defines all available HTTP route handlers mapped to their implementations.
 * Each HTTP route key is bound to its corresponding REST handler scheme.
 */
export type HTTPServerScheme = {
    [R in HTTPRoutes]: RESTScheme<R>;
};

/**
 * Wrapper class for managing and extending RESTful route handlers.
 * Provides access to a route's handler and supports middleware injection.
 */
class RESTHandler<T extends HTTPRoutes> {
    public readonly route: T;
    private _handler: HTTPServerScheme[T];

    constructor(route: T, handler: HTTPServerScheme[T]) {
        this.route = route;
        this._handler = handler;
    }

    /**
     * Returns the current handler for this route.
     */
    public get handler(): HTTPServerScheme[T] {
        return this._handler;
    }

    /**
     * Adds middleware to a specific HTTP method in the route handler.
     * The middleware runs before the original handler for that method.
     *
     * @param method - The HTTP method (GET, POST, OPTIONS) to attach middleware to.
     * @param fn - A function to run before the method's main handler.
     * @returns The RESTHandler instance (for chaining).
     */
    public addMiddleware<K extends keyof HTTPServerScheme[T]>(
        method: K,
        fn: (req: BunRequest<T>, server: Server) => void,
    ): RESTHandler<T> {
        if (!Object.hasOwn(this._handler, method)) {
            throw HTTPRequestHandlerError.factory.InternalError(
                "Target method not found in the http route's handler to add middleware.",
            );
        }

        if (typeof this._handler[method] !== "function") {
            throw HTTPRequestHandlerError.factory.InternalError(
                `Target method ${String(method)} is not a callable handler.`,
            );
        }

        const oldHandler = this._handler[method];
        this._handler[method] = ((req: BunRequest<T>, server: Server) => {
            const response = fn(req, server);
            if (response !== undefined) return response;
            return oldHandler(req);
        }) as HTTPServerScheme[T][K];
        return this;
    }
}

/**
 * Handles all incoming HTTP requests by routing them to the correct handler
 * based on the HTTP method and route.
 */
export class HTTPRequestHandler {
    private _buildRoot<T extends HTTPRoutes>(
        route: T,
        body: HTTPServerScheme[T],
    ): RESTHandler<T> {
        return new RESTHandler<T>(route, body);
    }

    /**
     * Handles the root GET request.
     * Used for displaying server availability.
     */
    private _root(): RESTHandler<HTTPRoutes.Root> {
        return this._buildRoot(HTTPRoutes.Root, {
            GET: () =>
                new CORSResponse({
                    success: true,
                    message: "Chess server is running.",
                }),
        });
    }

    /**
     * Handles the /health GET request.
     * Used as a health check endpoint.
     */
    private _health(): RESTHandler<HTTPRoutes.Health> {
        return this._buildRoot(HTTPRoutes.Health, {
            GET: () =>
                new CORSResponse({
                    success: true,
                    message: "OK",
                }),
        });
    }

    /**
     * Handles the /check-lobby GET request.
     * Validates the lobbyId and returns whether the lobby exists.
     */
    private _checkLobby(): RESTHandler<HTTPRoutes.CheckLobby> {
        return this._buildRoot(HTTPRoutes.CheckLobby, {
            GET: (req) => {
                try {
                    const lobbyId = req.params.lobbyId;

                    HTTPGetRequestValidator.validate(
                        HTTPRoutes.CheckLobby,
                        req,
                    );

                    const isLobbyFound = LobbyRegistry.check(lobbyId);

                    if (!isLobbyFound) {
                        return new CORSResponse(
                            {
                                success: false,
                                message:
                                    HTTPRequestHandlerError.factory.LobbyNotFound(
                                        lobbyId,
                                    ).message,
                                data: false
                            },
                            { status: 404 },
                        );
                    }

                    return new CORSResponse(
                        { success: true, message: "Lobby found", data: isLobbyFound },
                        { status: 200 },
                    );
                } catch (e: unknown) {
                    return createResponseFromHTTPError(
                        e,
                        HTTPRequestHandlerError.factory.UnexpectedErrorWhileCheckingLobby(),
                    );
                }
            },
        });
    }

    /**
     * Handles the /create-lobby endpoint for GET, OPTIONS, and POST.
     * POST: Creates a new lobby and player.
     */
    private _createLobby(): RESTHandler<HTTPRoutes.CreateLobby> {
        return this._buildRoot(HTTPRoutes.CreateLobby, {
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
                            HTTPRoutes.CreateLobby,
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
                    return createResponseFromHTTPError(
                        e,
                        HTTPRequestHandlerError.factory.UnexpectedErrorWhileCreatingLobby(),
                    );
                }
            },
        });
    }

    /**
     * Handles the /connect-lobby endpoint for GET, OPTIONS, and POST.
     * POST: Connects a player to an existing lobby.
     */
    private _connectLobby(): RESTHandler<HTTPRoutes.ConnectLobby> {
        return this._buildRoot(HTTPRoutes.ConnectLobby, {
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
                            HTTPRoutes.ConnectLobby,
                            req,
                        );

                    const lobby = LobbyRegistry.get(body.lobbyId);
                    if (!lobby) {
                        return new CORSResponse(
                            {
                                success: false,
                                message:
                                    HTTPRequestHandlerError.factory.LobbyNotFound(
                                        body.lobbyId,
                                    ).message,
                            },
                            { status: 404 },
                        );
                    }

                    if (lobby.isGameStarted()) {
                        return new CORSResponse(
                            {
                                success: false,
                                message:
                                    HTTPRequestHandlerError.factory.LobbyAlreadyStarted(
                                        body.lobbyId,
                                    ).message,
                            },
                            { status: 403 },
                        );
                    }

                    if (lobby.areBothPlayersOnline()) {
                        return new CORSResponse(
                            {
                                success: false,
                                message:
                                    HTTPRequestHandlerError.factory.LobbyFull(
                                        body.lobbyId,
                                    ).message,
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
                    return createResponseFromHTTPError(
                        e,
                        HTTPRequestHandlerError.factory.UnexpectedErrorWhileConnectingLobby(),
                    );
                }
            },
        });
    }

    /**
     * Handles the /reconnect-lobby endpoint for GET, OPTIONS, and POST.
     * POST: Reconnects an offline player to their lobby if eligible.
     */
    private _reconnectLobby(): RESTHandler<HTTPRoutes.ReconnectLobby> {
        return this._buildRoot(HTTPRoutes.ReconnectLobby, {
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
                            HTTPRoutes.ReconnectLobby,
                            req,
                        );

                    const lobby = LobbyRegistry.get(body.lobbyId);
                    if (!lobby) {
                        return new CORSResponse(
                            {
                                success: false,
                                message:
                                    HTTPRequestHandlerError.factory.LobbyNotFound(
                                        body.lobbyId,
                                    ).message,
                            },
                            { status: 404 },
                        );
                    }

                    const player = PlayerRegistry.get(body.playerToken);
                    if (!player) {
                        return new CORSResponse(
                            {
                                success: false,
                                message:
                                    HTTPRequestHandlerError.factory.PlayerNotFound(
                                        body.playerToken,
                                    ).message,
                            },
                            { status: 401 },
                        );
                    }

                    if (!lobby.isPlayerInLobby(player)) {
                        return new CORSResponse(
                            {
                                success: false,
                                message:
                                    HTTPRequestHandlerError.factory.PlayerNotInLobby(
                                        body.lobbyId,
                                        body.playerToken,
                                    ).message,
                            },
                            { status: 403 },
                        );
                    }

                    if (player.isOnline) {
                        return new CORSResponse(
                            {
                                success: false,
                                message:
                                    HTTPRequestHandlerError.factory.PlayerAlreadyOnline(
                                        body.lobbyId,
                                        body.playerToken,
                                    ).message,
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
                    return createResponseFromHTTPError(
                        e,
                        HTTPRequestHandlerError.factory.UnexpectedErrorWhileReconnectingLobby(),
                    );
                }
            },
        });
    }

    /**
     * Enforces the configured rate limit for incoming requests.
     * Extracts the client IP, throws if unavailable, and applies
     * the rate limiter if rate limiting is enabled.
     */
    public enforceRateLimit(req: Request, server: Server) {
        if (Number(Bun.env.ENABLE_RATE_LIMIT) !== 1)
            return;

        const ip = server.requestIP(req)?.address;
        if (!ip) throw HTTPRequestHandlerError.factory.IpAddressNotFound();

        return rateLimiter(ip);
    }

    /**
     * Exposes all HTTP request handlers mapped by their corresponding routes.
     *
     * @returns A mapping of all available HTTP routes to their handlers.
     */
    public expose(): HTTPServerScheme {
        const restHandlers = [
            this._root(),
            this._health(),
            this._checkLobby().addMiddleware("GET", this.enforceRateLimit),
            this._createLobby().addMiddleware("POST", this.enforceRateLimit),
            this._connectLobby().addMiddleware("POST", this.enforceRateLimit),
            this._reconnectLobby().addMiddleware("POST", this.enforceRateLimit),
        ];

        return Object.fromEntries(
            restHandlers.map(r => [r.route, r.handler])
        ) as HTTPServerScheme;
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
