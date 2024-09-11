// Server settings
export const ALLOWED_ORIGINS = [
    'http://localhost:5173',
];

export const SERVER_PORT = 3000;
export const MAX_PAYLOAD_LENGTH = 1024 * 1024; // 1MB

// Game limits
export const MAX_PLAYER_NAME_LENGTH = 25;
export const MIN_PLAYER_NAME_LENGTH = 3;

export const MAX_TOTAL_TIME = 60; // 60 minutes
export const MIN_TOTAL_TIME = 0.1; // 6 seconds

export const MAX_INCREMENT_TIME = 30; // 30 seconds
export const MIN_INCREMENT_TIME = 0;