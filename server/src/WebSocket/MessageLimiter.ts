import { WsCommand } from "./WsCommand";
import { WsTitle } from "./types";

/**
 *  Represents the state of requests from a single IP
 */
interface WSMessageLimitRecord {
    count: number;
    firstMessageTime: number;
}

const playerMessages: Map<string, WSMessageLimitRecord> = new Map();

/**
 * Simple in-memory rate limiter based on player id.
 * Allows up to MESSAGE_LIMIT requests per MESSAGE_WINDOW_MS,
 * returns WsCommand (WsTitle.Error) if limit is exceeded
 * otherwise undefined.
 */
export function messageLimiter(playerId: string): string | undefined {
    const now = Date.now();

    const record: WSMessageLimitRecord | undefined = playerMessages.get(playerId);

    if (!record) {
        playerMessages.set(playerId, { count: 1, firstMessageTime: now });
        return;
    }

    if (now - record.firstMessageTime < Number(Bun.env.MESSAGE_WINDOW_MS)) {
        if (record.count >= Number(Bun.env.MESSAGE_LIMIT)) {
            return WsCommand.create([
                WsTitle.Error,
                {
                    message: `Rate limit exceeded. Retry-After=${Number(Bun.env.MESSAGE_WINDOW_MS) / 1000}s, Limit=${Number(Bun.env.MESSAGE_LIMIT)}, Remaining=0`
                }
            ])
        }
        record.count += 1;
    } else {
        record.firstMessageTime = now;
        record.count = 1;
    }

    return undefined;
}
