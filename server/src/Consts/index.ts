/**
 * Server Settings
 */
export const CORS_HEADERS: Record<string, string> = {
    "Access-Control-Allow-Origin": Bun.env.CORS_ORIGIN || "*",
    "Access-Control-Allow-Methods": "OPTIONS, GET, POST",
    "Access-Control-Allow-Headers": "Content-Type",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy":
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "connect-src 'self' ws: wss:; " +
        "object-src 'none'; " +
        "base-uri 'self';",
};

export const DEFAULT_CORS_RESPONSE: ResponseInit = {
    status: 200,
};

/**
 * Lobby Settings
 */
export const MAX_PLAYER_NAME_LENGTH = 25;
export const MIN_PLAYER_NAME_LENGTH = 3;

export const MAX_REMAINING_TIME = 60 * 60000; // 60 minutes
export const MIN_REMAINING_TIME = 15 * 1000; // 15 second

export const MAX_INCREMENT_TIME = 30 * 1000; // 30 seconds
export const MIN_INCREMENT_TIME = 0;

export const DESTROY_INACTIVE_LOBBY_TIMEOUT = 1000 * 60 * 60 * 24; // 24 hours

/**
 * General Settings
 */
export const GU_ID_LENGTH = 6; // General Use ID Length
export const MIN_FEN_LENGTH = 20;
export const MAX_FEN_LENGTH = 100;
