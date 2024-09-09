import { ALLOWED_ORIGINS } from "../Consts";

/**
 * Create a random user token.
 */
export function createUserToken(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if the origin is allowed to connect.
 */
export function isOriginAllowed(req: Request): boolean {
    const origin = req.headers.get("origin") || "";
    if(!origin) return false;
    return ALLOWED_ORIGINS.includes(origin);
}


/**
 * Check if the parameters are valid.
 */
export function areParametersValid(
    playerName: string | null, 
    lobbyId: string | null, 
    userToken: string | null
): Response | boolean {
    if(playerName && userToken)
        return new Response("Invalid request. playerName and userToken cannot be used together.", {status: 400});

    if(!playerName && !userToken)
        return new Response("Invalid request. playerName or userToken must be provided.", {status: 400});

    if(userToken && !lobbyId)
        return new Response("Invalid request. userToken must be used with lobbyId.", {status: 400});

    return true;
}
