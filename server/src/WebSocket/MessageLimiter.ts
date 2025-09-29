import { WsCommand } from "./WsCommand";
import { WsTitle } from "./types";

const MESSAGE_WINDOW_MS = Number(Bun.env.MESSAGE_WINDOW_MS);
const MESSAGE_LIMIT = Number(Bun.env.MESSAGE_LIMIT);

/**
 *  Represents the state of requests from a single IP
 */
interface WSMessageLimitRecord {
    count: number;
    firstMessageTime: number;
}

const ipMessages: Map<string, WSMessageLimitRecord> = new Map();

/**
 * Prunes the `ipMessages` map by removing stale IP message records.
 *
 * If `force` is true, all records are removed regardless of age.
 * Otherwise, only records older than the rate limiting window (`MESSAGE_WINDOW_MS`) are removed.
 *
 * @param force - If true, removes all records regardless of age. If false, only removes records older than the expiration threshold.
 */
export function pruneIPMessages(force = false): number {
    const now = Date.now();

    const lengthBeforeCleaning = ipMessages.size;
    for (const [ip, record] of ipMessages.entries()) {
        if (force || now - record.firstMessageTime > MESSAGE_WINDOW_MS) {
            ipMessages.delete(ip);
        }
    }

    const removedRecordCount = lengthBeforeCleaning - ipMessages.size;
    //console.log(`Removed ${lengthBeforeCleaning - ipMessages.size} IP records${force ? " (force)" : ""} from MessageLimiter's records.`);
    return removedRecordCount;
}

/**
 * Simple in-memory websocket message limiter based on IP.
 * Allows up to MESSAGE_LIMIT requests per MESSAGE_WINDOW_MS,
 * returns WsCommand (WsTitle.Error) if limit is exceeded
 * otherwise undefined.
 */
export function messageLimiter(ip: string): string | undefined {
    const now = Date.now();

    const record: WSMessageLimitRecord | undefined = ipMessages.get(ip);

    if (!record) {
        ipMessages.set(ip, { count: 1, firstMessageTime: now });
        return;
    }

    if (now - record.firstMessageTime < MESSAGE_WINDOW_MS) {
        if (record.count >= Number(Bun.env.MESSAGE_LIMIT)) {
            return WsCommand.create([
                WsTitle.Error,
                {
                    message: `Rate limit exceeded. Retry-After=${MESSAGE_WINDOW_MS}ms, Limit=${MESSAGE_LIMIT}, Remaining=0`
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
