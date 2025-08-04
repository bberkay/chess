import { CORS_HEADERS, DEFAULT_CORS_RESPONSE } from "@Consts";
import { HTTPResponseData } from ".";

/**
 * Defines the shape of the response body used for CORS-compatible HTTP responses.
 *
 * @template T - A key of HTTPResponseData representing the expected data type.
 */
export interface CORSResponseBody<T extends keyof HTTPResponseData> {
    success: boolean;
    message: string;
    data?: HTTPResponseData[T];
}

/**
 * Creates a ResponseInit object with proper CORS headers and a default status code
 * based on the success state of the response body.
 *
 * @template T - A key of HTTPResponseData.
 * @param body - The response body to infer status code and structure.
 * @param init - Optional initial ResponseInit values to override defaults.
 * @returns A valid ResponseInit object with merged headers and status.
 */
function createCorsResponseInit<T extends keyof HTTPResponseData>(
    body: CORSResponseBody<T>,
    init?: ResponseInit,
): ResponseInit {
    const status = init?.status ?? (body.success ? 200 : 400);

    return {
        ...DEFAULT_CORS_RESPONSE,
        ...init,
        status,
        headers: {
            ...CORS_HEADERS,
            ...(init?.headers),
        },
    };
}

/**
 * A custom Response class that automatically applies CORS headers and
 * serializes the response body as JSON. Intended for use in Bun or similar frameworks.
 *
 * @template R - A key of HTTPResponseData indicating the type of data returned in the response.
 */
export class CORSResponse<R extends keyof HTTPResponseData> extends Response {
    /**
     * Constructs a new CORSResponse instance with automatic CORS headers and status code.
     *
     * @param body - The response body containing success, message, and optional data fields.
     * @param init - Optional ResponseInit values such as status or additional headers.
     */
    constructor(
        body: CORSResponseBody<R>,
        init?: ResponseInit,
    ) {
        super(JSON.stringify(body), createCorsResponseInit(body, init));
    }
}
