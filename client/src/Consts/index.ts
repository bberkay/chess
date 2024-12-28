/**
 * Page Settings
 */
export const DEFAULT_TITLE = "Chess Platform";

/**
 * Server Settings
 */
export const SERVER_ADDRESS = import.meta.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://chess-server-3j94.onrender.com";
export const WS_ADDRESS = import.meta.env.NODE_ENV === "development"
    ? "ws://localhost:3000"
    : "wss://chess-server-3j94.onrender.com";
export const WS_ENDPOINT_MAX_LENGTH = 1000;

/**
 * When the socket connection is lost, the client will
 * attempt to reconnect to the server. This is the limit
 * of reconnection attempts and the timeout between each
 * attempt.
 */
export const RECONNECTION_ATTEMPT_LIMIT = 3;
export const RECONNECTION_TIMEOUT = 5; // seconds

/**
 * Project Details
 */
export const REPOSITORY_URL = "https://github.com/bberkay/chess"
