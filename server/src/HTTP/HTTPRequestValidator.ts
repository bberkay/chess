import {
    GU_ID_LENGTH,
    MAX_FEN_LENGTH,
    MAX_INCREMENT_TIME,
    MAX_PLAYER_NAME_LENGTH,
    MAX_REMAINING_TIME,
    MIN_FEN_LENGTH,
    MIN_INCREMENT_TIME,
    MIN_PLAYER_NAME_LENGTH,
    MIN_REMAINING_TIME,
} from "@Consts";
import { isInRange, isValidLength } from "@Utils";
import { BunRequest } from "bun";
import { HTTPPostBody, HTTPRoutes, HTTPRequestValidatorError } from ".";
import { assertNoMaliciousContent } from "./utils";

// TODO: If a http request requires both path and body validation,
// first HTTPGetRequestValidator.validate can be used on the request,
// and then HTTPPostRequestValidator.parseAndValidate can be applied.
// This system could be unified under a single HTTPRequestValidator
// (with .validate(), .parse() etc.) or it could be refactored into
// HTTPRequestPathValidator and HTTPRequestBodyValidator.

/**
 * Validates incoming request's path for specific routes by checking
 * required URL parameters and their formats.
 */
export class HTTPGetRequestValidator {
    /**
     * Validates a GET request for the given route by dispatching
     * to the corresponding route-specific validation method.
     *
     * @param route - The HTTP GET route to validate.
     * @param req - The incoming BunRequest object.
     * @throws HTTPValidationError if the route is not supported or validation fails.
     */
    public static validate<T extends HTTPRoutes>(
        route: T,
        req: BunRequest<T>,
    ): void {
        assertNoMaliciousContent(req.params);

        switch (route) {
            case HTTPRoutes.CheckLobby:
                HTTPGetRequestValidator._validateCheck(req as BunRequest<HTTPRoutes.CheckLobby>);
                break;
            default:
                throw HTTPRequestValidatorError.factory.InvalidRoute(route)
        }
    }

    /**
     * Validates the 'CheckLobby' GET route by verifying the lobbyId
     * parameter is present and of the correct length.
     *
     * @param req - The incoming BunRequest object for CheckLobby route.
     * @throws HTTPValidationError if lobbyId is missing or invalid.
     */
    private static _validateCheck(
        req: BunRequest<HTTPRoutes.CheckLobby>,
    ): void {
        if (
            !req.params.lobbyId ||
            !isValidLength(req.params.lobbyId, GU_ID_LENGTH)
        )
            throw HTTPRequestValidatorError.factory.InvalidLobbyIdLength();
    }
}

/**
 * Validates and parses incoming request's body for specific routes.
 * Throws an HTTPValidationError if input validation fails.
 */
export class HTTPPostRequestValidator {
    /**
     * Parses and validates the request body for the given POST route.
     *
     * @param route - The HTTP POST route to validate.
     * @param req - The incoming BunRequest object.
     * @returns The validated and typed body object.
     * @throws HTTPValidationError if the route is not supported or validation fails.
     */
    public static async parseAndValidate<T extends keyof HTTPPostBody>(
        route: T,
        req: BunRequest<T>
    ): Promise<HTTPPostBody[T]> {
        assertNoMaliciousContent(req.params);

        const body: HTTPPostBody[T] = await req.json();
        switch (route) {
            case HTTPRoutes.CreateLobby:
                HTTPPostRequestValidator._validateCreate(body as HTTPPostBody[HTTPRoutes.CreateLobby]);
                break;
            case HTTPRoutes.ConnectLobby:
                HTTPPostRequestValidator._validateConnect(body as HTTPPostBody[HTTPRoutes.ConnectLobby]);
                break;
            case HTTPRoutes.ReconnectLobby:
                HTTPPostRequestValidator._validateReconnect(body as HTTPPostBody[HTTPRoutes.ReconnectLobby])
                break;
            default:
                throw HTTPRequestValidatorError.factory.InvalidRoute(route);
        }

        return body;
    }

    /**
     * Validates and parses the request body for the CreateLobby POST route.
     * Ensures fields such as name, board, remaining, and increment are valid.
     *
     * @param req - The incoming BunRequest object for CreateLobby.
     * @returns The validated request body.
     * @throws HTTPValidationError if any field is invalid or missing.
     */
    private static _validateCreate(
        body: HTTPPostBody[HTTPRoutes.CreateLobby],
    ): void {
        assertNoMaliciousContent(body);

        if (!isInRange(
            body.name.length,
            MIN_PLAYER_NAME_LENGTH,
            MAX_PLAYER_NAME_LENGTH,
        ))
            throw HTTPRequestValidatorError.factory.InvalidNameLength();

        if (!isInRange(body.board.length, MIN_FEN_LENGTH, MAX_FEN_LENGTH))
            throw HTTPRequestValidatorError.factory.InvalidBoardLength();

        if (!isInRange(body.remaining, MIN_REMAINING_TIME, MAX_REMAINING_TIME))
            throw HTTPRequestValidatorError.factory.InvalidRemainingValue();

        if (!isInRange(body.increment, MIN_INCREMENT_TIME, MAX_INCREMENT_TIME))
            throw HTTPRequestValidatorError.factory.InvalidIncrementValue();
    }

    /**
     * Validates and parses the request body for the ConnectLobby POST route.
     * Ensures that the name and lobbyId fields are valid.
     *
     * @param req - The incoming BunRequest object for ConnectLobby.
     * @returns The validated request body.
     * @throws HTTPValidationError if any field is invalid or missing.
     */
    private static _validateConnect(
        body: HTTPPostBody[HTTPRoutes.ConnectLobby],
    ): void {
        if (
            !body.name ||
            !isInRange(
                body.name.length,
                MIN_PLAYER_NAME_LENGTH,
                MAX_PLAYER_NAME_LENGTH,
            )
        )
            throw HTTPRequestValidatorError.factory.InvalidNameLength()

        if (!body.lobbyId || !isValidLength(body.lobbyId, GU_ID_LENGTH))
            throw HTTPRequestValidatorError.factory.InvalidLobbyIdLength();
    }

    /**
     * Validates and parses the request body for the ReconnectLobby POST route.
     * Ensures that lobbyId and playerToken are valid.
     *
     * @param req - The incoming BunRequest object for ReconnectLobby.
     * @returns The validated request body.
     * @throws HTTPValidationError if any field is invalid or missing.
     */
    private static _validateReconnect(
        body: HTTPPostBody[HTTPRoutes.ReconnectLobby],
    ): void {
        if (!body.lobbyId || !isValidLength(body.lobbyId, GU_ID_LENGTH))
            throw HTTPRequestValidatorError.factory.InvalidLobbyIdLength();

        if (!body.playerToken || !isValidLength(body.playerToken, GU_ID_LENGTH))
            throw HTTPRequestValidatorError.factory.InvalidPlayerTokenLength()
    }
}
