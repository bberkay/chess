import { ALLOWED_ORIGINS } from "../Consts";
import { 
    MAX_PLAYER_NAME_LENGTH,
    MIN_PLAYER_NAME_LENGTH,
    MAX_TOTAL_TIME,
    MIN_TOTAL_TIME,
    MAX_INCREMENT_TIME,
    MIN_INCREMENT_TIME
} from "../Consts";

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
export function areParametersValid(req: Request): Response | { 
    playerName: string | null, 
    lobbyId: string | null, 
    userToken: string | null, 
    board: string | null, 
    totalTime: string | null, 
    incrementTime: string | null } 
{
    const url = new URL(req.url);
    const playerName = url.searchParams.get("playerName");
    const lobbyId = url.searchParams.get("lobbyId");
    const userToken = url.searchParams.get("userToken");
    const board = url.searchParams.get("board");
    const totalTime = url.searchParams.get("totalTime");
    const incrementTime = url.searchParams.get("incrementTime");

    if(playerName && userToken)
        return new Response("Invalid request. playerName and userToken cannot be used together.", {status: 400});

    if(!playerName && !userToken)
        return new Response("Invalid request. playerName or userToken must be provided.", {status: 400});

    if(userToken && !lobbyId)
        return new Response("Invalid request. userToken must be used with lobbyId.", {status: 400});

    if(playerName && (playerName.length < MIN_PLAYER_NAME_LENGTH || playerName.length > MAX_PLAYER_NAME_LENGTH))
        return new Response("Invalid request. playerName length must be between 3 and 25.", {status: 400});

    if(lobbyId && (lobbyId.length < 6 || lobbyId.length > 6))
        return new Response("Invalid request. lobbyId length must be 6.", {status: 400});

    if(userToken && (userToken.length < 6 || userToken.length > 6))
        return new Response("Invalid request. userToken length must be 6.", {status: 400});

    if((board || totalTime || incrementTime) && !playerName || lobbyId || userToken)
        return new Response("Invalid request. board, totalTime, incrementTime can only be used when creating a new lobby.", {status: 400});

    if((playerName && !lobbyId) && (!board || !totalTime || !incrementTime))
        return new Response("Invalid request. board, totalTime, incrementTime must be provided when creating a new lobby.", {status: 400});

    if(board && board.length > 100)
        return new Response("Invalid request. board length must be less than 100.", {status: 400});

    if(totalTime){
        const totalTimeNumber = parseInt(totalTime);
        if(isNaN(totalTimeNumber) || totalTimeNumber < MIN_TOTAL_TIME || totalTimeNumber > MAX_TOTAL_TIME)
            return new Response("Invalid request. totalTime must be a number between 0.1 and 60.", {status: 400});
    }

    if(incrementTime){
        const incrementTimeNumber = parseInt(incrementTime);
        if(isNaN(incrementTimeNumber) || incrementTimeNumber < MIN_INCREMENT_TIME || incrementTimeNumber > MAX_INCREMENT_TIME)
            return new Response("Invalid request. incrementTime must be a number between 0 and 30.", {status: 400});
    }

    return { playerName, lobbyId, userToken, board, totalTime, incrementTime };
}
