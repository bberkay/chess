import { Color } from "@Chess/Types";

/**
 * Represents a player/user.
 */
export interface Player {
    token: string;
    id: string;
    name: string;
    isOnline: boolean;
}

/*
 * Inform players about their opponent.
 * Should not include sensitive information,
 * as it will be shared with both players in the lobby.
 */
export interface Players {
    [Color.White]: Omit<Player, "token">
    [Color.Black]: Omit<Player, "token">
}
