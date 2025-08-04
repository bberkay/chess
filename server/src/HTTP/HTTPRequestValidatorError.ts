import {
    GU_ID_LENGTH,
    MAX_FEN_LENGTH,
    MAX_INCREMENT_TIME,
    MAX_PLAYER_NAME_LENGTH,
    MAX_REMAINING_TIME,
    MIN_INCREMENT_TIME,
    MIN_PLAYER_NAME_LENGTH,
    MIN_REMAINING_TIME,
} from "@Consts";

const HTTPRequestErrorTemplates = {
    InvalidRoute: (route: string) =>
        `Invalid request. Given route ${route} is not implemented.`,
    InvalidLobbyIdLength: () =>
        `Invalid request. "lobbyId" length must be ${GU_ID_LENGTH} length.`,
    InvalidNameLength: () =>
        `Invalid request. "name" length must be between ${MIN_PLAYER_NAME_LENGTH} and ${MAX_PLAYER_NAME_LENGTH}.`,
    InvalidBoardLength: () =>
        `Invalid request. "board" length must be less than ${MAX_FEN_LENGTH}.`,
    InvalidRemainingValue: () =>
        `Invalid request. "remaining" must be a number between ${MIN_REMAINING_TIME} and ${MAX_REMAINING_TIME}.`,
    InvalidIncrementValue: () =>
        `Invalid request. "increment" must be a number between ${MIN_INCREMENT_TIME} and ${MAX_INCREMENT_TIME}.`,
    InvalidPlayerTokenLength: () =>
        `Invalid request. "playerToken" length must be ${GU_ID_LENGTH}`,
} as const;

type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => HTTPRequestValidatorError
        : never;
};

type HTTPRequestErrorTemplate = keyof typeof HTTPRequestErrorTemplates;

export class HTTPRequestValidatorError extends Error {
    public readonly key: HTTPRequestErrorTemplate;

    private constructor(key: HTTPRequestErrorTemplate, message: string) {
        super(message);
        this.name = "HTTPRequestValidatorError";
        this.key = key;
    }

    public static readonly factory = Object.fromEntries(
        Object.entries(HTTPRequestErrorTemplates).map(([key, template]) => {
            return [
                key,
                (...args: unknown[]) =>
                    new HTTPRequestValidatorError(
                        key as HTTPRequestErrorTemplate,
                        (template as (...args: unknown[]) => string)(...args),
                    ),
            ];
        }),
    ) as ErrorFactory<typeof HTTPRequestErrorTemplates>;
}
