import { CORSResponse, HTTPRoutes } from "@HTTP";

const RATE_WINDOW_MS = Number(Bun.env.RATE_WINDOW_MS);
const RATE_LIMIT = Number(Bun.env.RATE_LIMIT);

/**
 *  Represents the state of requests from a single IP
 */
interface HTTPRequestLimitRecord {
    count: number;
    firstRequestTime: number;
}

const ipRequests: Map<string, HTTPRequestLimitRecord> = new Map();

/**
 * Prunes the `ipRequests` map by removing stale IP request records.
 *
 * If `force` is true, all records are removed regardless of age.
 * Otherwise, only records older than the rate limiting window (`RATE_WINDOW_MS`) are removed.
 *
 * @param force - If true, removes all records regardless of age. If false, only removes records older than the expiration threshold.
 */
export function pruneIPRequests(force = false) {
    const now = Date.now();

    const lengthBeforeCleaning = ipRequests.size;
    for (const [ip, record] of ipRequests.entries()) {
        if (force || now - record.firstRequestTime > RATE_WINDOW_MS) {
            ipRequests.delete(ip);
        }
    }

    console.log(`Removed ${lengthBeforeCleaning - ipRequests.size} IP records${force ? " (force)" : ""} from RateLimiter's records.`);
}

/**
 * Simple in-memory rate limiter based on IP.
 * Allows up to RATE_LIMIT requests per RATE_WINDOW_MS,
 * returns 429 if limit is exceeded otherwise undefined.
 */
export function rateLimiter(ip: string): CORSResponse<HTTPRoutes.Root> | undefined {
    const now = Date.now();

    const record: HTTPRequestLimitRecord | undefined = ipRequests.get(ip);

    if (!record) {
        ipRequests.set(ip, { count: 1, firstRequestTime: now });
        return;
    }

    if (now - record.firstRequestTime < RATE_WINDOW_MS) {
        if (record.count >= RATE_LIMIT) {
            return new CORSResponse({
                success: false,
                message: "NO",
            },
            {
                status: 429,
                headers: {
                    "Retry-After": RATE_WINDOW_MS.toString(),
                    "X-RateLimit-Limit": RATE_LIMIT.toString(),
                    "X-RateLimit-Remaining": "0",
                }
            });
        }
        record.count += 1;
    } else {
        record.firstRequestTime = now;
        record.count = 1;
    }

    return;
}
