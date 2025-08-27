import { CORSResponse, HTTPRoutes } from "@HTTP";

interface HTTPRequestLimitRecord {
    count: number;
    firstRequestTime: number;
}
// TODO: Close rate limiter on development from env
// TODO: Add vars into env or consts
const RATE_LIMIT = 180; // 3 requests per seconds
const WINDOW_MS = 60_000; // 60 seconds

const ipRequests: Map<string, HTTPRequestLimitRecord> = new Map();

/**
 * Simple in-memory rate limiter based on IP.
 * Allows up to RATE_LIMIT requests per WINDOW_MS,
 * returns 429 when limit is exceeded.
 */
export function rateLimiter(ip: string): CORSResponse<HTTPRoutes.Root> {
    const now = Date.now();

    const record: HTTPRequestLimitRecord | undefined = ipRequests.get(ip);

    if (!record) {
        ipRequests.set(ip, { count: 1, firstRequestTime: now });
        return new CORSResponse({
            success: true,
            message: "OK",
        });
    }

    if (now - record.firstRequestTime < WINDOW_MS) {
        if (record.count >= RATE_LIMIT) {
            return new CORSResponse({
                success: false,
                message: "NO",
            },
            {
                status: 429,
                statusText: "Too Many Requests",
                headers: {
                    "Retry-After": (WINDOW_MS / 1000).toString(),
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

    return new CORSResponse({
        success: true,
        message: "OK",
    });
}
