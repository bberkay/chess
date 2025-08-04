export const LobbyErrorMsg = {

} as const;

export type LobbyErrorMsg = typeof LobbyErrorMsg[keyof typeof LobbyErrorMsg];

export class LobbyError extends Error {
    constructor(message: LobbyErrorMsg) {
        super(message);
        this.name = "LobbyError";
    }
}
