/**
 * Port for the websocket server.
 */
export const SERVER_PORT = 3000;

/**
 * Allowed origins for the websocket server.
 */
export const ALLOWED_ORIGINS = [
    'http://localhost:5173',
];

/**
 * Maximum payload length for websocket messages.
 */
export const MAX_PAYLOAD_LENGTH = 1024 * 1024; // 1MB