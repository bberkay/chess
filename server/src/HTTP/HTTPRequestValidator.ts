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

// TODO: If a http request requires both path and body validation,
// first HTTPGetRequestValidator.validate can be used on the request,
// and then HTTPPostRequestValidator.parseAndValidate can be applied.
// This system could be unified under a single HTTPRequestValidator
// (with .validate(), .parse() etc.) or it could be refactored into
// HTTPRequestPathValidator and HTTPRequestBodyValidator.

/**
 * A function signature for validating GET requests based on route.
 */
type GetValidator<T extends HTTPRoutes> = (
    req: BunRequest<T>
) => void;

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
        let validator;
        switch (route) {
            case HTTPRoutes.CheckLobby:
                validator = HTTPGetRequestValidator._validateCheck as GetValidator<T>;
                break;
            default:
                throw HTTPRequestValidatorError.factory.InvalidRoute(route)
        }
        validator(req);
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
 * A function signature for validating POST requests and returning
 * the parsed request body.
 */
type PostValidator<T extends keyof HTTPPostBody> = (
    req: BunRequest<T>
) => Promise<HTTPPostBody[T]>;

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
        let validator;
        switch (route) {
            case HTTPRoutes.CreateLobby:
                validator = HTTPPostRequestValidator._validateCreate as PostValidator<T>;
                break;
            case HTTPRoutes.ConnectLobby:
                validator = HTTPPostRequestValidator._validateConnect as PostValidator<T>;
                break;
            case HTTPRoutes.ReconnectLobby:
                validator = HTTPPostRequestValidator._validateReconnect as PostValidator<T>;
                break;
            default:
                throw HTTPRequestValidatorError.factory.InvalidRoute(route);
        }
        return await validator(req);
    }

    /**
     * Validates and parses the request body for the CreateLobby POST route.
     * Ensures fields such as name, board, remaining, and increment are valid.
     *
     * @param req - The incoming BunRequest object for CreateLobby.
     * @returns The validated request body.
     * @throws HTTPValidationError if any field is invalid or missing.
     */
    private static async _validateCreate<T extends HTTPRoutes.CreateLobby>(
        req: BunRequest<T>,
    ): Promise<HTTPPostBody[T]> {
        const body: HTTPPostBody[T] = await req.json();
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

        return body;
    }

    /**
     * Validates and parses the request body for the ConnectLobby POST route.
     * Ensures that the name and lobbyId fields are valid.
     *
     * @param req - The incoming BunRequest object for ConnectLobby.
     * @returns The validated request body.
     * @throws HTTPValidationError if any field is invalid or missing.
     */
    private static async _validateConnect<T extends HTTPRoutes.ConnectLobby>(
        req: BunRequest<T>,
    ): Promise<HTTPPostBody[T]> {
        const body: HTTPPostBody[T] = await req.json();
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

        return body;
    }

    /**
     * Validates and parses the request body for the ReconnectLobby POST route.
     * Ensures that lobbyId and playerToken are valid.
     *
     * @param req - The incoming BunRequest object for ReconnectLobby.
     * @returns The validated request body.
     * @throws HTTPValidationError if any field is invalid or missing.
     */
    private static async _validateReconnect<T extends HTTPRoutes.ReconnectLobby>(
        req: BunRequest<T>,
    ): Promise<HTTPPostBody[T]> {
        const body: HTTPPostBody[T] = await req.json();
        if (!body.lobbyId || !isValidLength(body.lobbyId, GU_ID_LENGTH))
            throw HTTPRequestValidatorError.factory.InvalidLobbyIdLength();

        if (!body.playerToken || !isValidLength(body.playerToken, GU_ID_LENGTH))
            throw HTTPRequestValidatorError.factory.InvalidPlayerTokenLength()

        return body;
    }
}
