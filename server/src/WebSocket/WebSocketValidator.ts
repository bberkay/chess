import { GU_ID_LENGTH } from "@Consts";
import { isValidLength } from "@Utils";
import { WebSocketValidatorError } from ".";

/**
 * Validates and extracts parameters from a WebSocket connection request URL.
 */
export class WebSocketValidator {
    /**
     * Parses and validates the lobbyId and playerToken from the WebSocket request URL.
     * Ensures both parameters exist and meet required length constraints.
     *
     * @param req - The incoming HTTP request used to initiate the WebSocket connection.
     * @returns An object containing valid `lobbyId` and `playerToken`.
     * @throws WebSocketValidationError - If either parameter is missing or invalid.
     */
    public static parseAndValidate(
        req: Request,
    ): { lobbyId: string, playerToken: string } {
        const url = new URL(req.url);

        const lobbyId = url.pathname.split("/")[1];
        if (!lobbyId || !isValidLength(lobbyId, GU_ID_LENGTH)) {
            throw WebSocketValidatorError.factory.InvalidLobbyIdLength();
        }

        const playerToken = url.searchParams.get("playerToken");
        if (!playerToken || !isValidLength(playerToken, GU_ID_LENGTH)) {
            throw WebSocketValidatorError.factory.InvalidPlayerTokenLength();
        }

        return { lobbyId, playerToken };
    }
}
