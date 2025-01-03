/**
 * Server Settings
 */
export const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Opener-Policy": "same-origin",
};

export const SERVER_PORT = 3000;
export const MAX_PAYLOAD_LENGTH = 1024 * 25; // 25 KB
export const MAX_IDLE_TIMEOUT = 16 * 60; // 16 minutes

/**
 * Lobby Settings
 */
export const MAX_PLAYER_NAME_LENGTH = 25;
export const MIN_PLAYER_NAME_LENGTH = 3;

export const MAX_TOTAL_TIME = 60 * 60000; // 60 minutes
export const MIN_TOTAL_TIME = 15 * 1000; // 15 second

export const MAX_INCREMENT_TIME = 30 * 1000; // 30 seconds
export const MIN_INCREMENT_TIME = 0;

export const DESTROY_INACTIVE_LOBBY_TIMEOUT = 1000 * 60 * 60 * 24; // 24 hours

/**
 * General Settings
 */
export const GU_ID_LENGTH = 6; // General Use ID Length

