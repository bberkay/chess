import { GU_ID_LENGTH } from "@Consts";

const WebSocketErrorTemplates = {
    InvalidPlayerTokenLength: () => `Invalid request. "playerToken" length must be ${GU_ID_LENGTH} and lobby must exist.`,
    InvalidLobbyIdLength: () => `Invalid request. "lobbyId" length must be ${GU_ID_LENGTH} length.`,
} as const;

type ErrorFactory<T> = {
    [K in keyof T]: T[K] extends (...args: infer P) => string
        ? (...args: P) => WebSocketValidatorError
        : never;
};

type WebSocketErrorTemplate = keyof typeof WebSocketErrorTemplates;

export class WebSocketValidatorError extends Error {
    public readonly key: WebSocketErrorTemplate;

    private constructor(key: WebSocketErrorTemplate, message: string) {
        super(message);
        this.name = "WebSocketValidatorError";
        this.key = key;
    }

    public static readonly factory = Object.fromEntries(
        Object.entries(WebSocketErrorTemplates).map(([key, template]) => {
            return [
                key,
                (...args: unknown[]) =>
                    new WebSocketValidatorError(
                        key as WebSocketErrorTemplate,
                        (template as (...args: unknown[]) => string)(...args),
                    ),
            ];
        }),
    ) as ErrorFactory<typeof WebSocketErrorTemplates>;
}
