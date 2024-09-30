/**
 * When the socket connection is lost, the client will 
 * attempt to reconnect to the server. This is the limit
 * of reconnection attempts and the timeout between each
 * attempt.
 */
export const RECONNECTION_ATTEMPT_LIMIT = 3;
export const RECONNECTION_TIMEOUT = 5; // seconds