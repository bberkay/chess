import { CORSResponse, HTTPRoutes } from "@HTTP";

/**
 *  Represents the state of requests from a single IP
 */
interface HTTPRequestLimitRecord {
    count: number;
    firstRequestTime: number;
}

const ipRequests: Map<string, HTTPRequestLimitRecord> = new Map();

/**
 * Simple in-memory rate limiter based on IP.
 * Allows up to RATE_LIMIT requests per RATE_WINDOW_MS,
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

    if (now - record.firstRequestTime < Number(Bun.env.RATE_WINDOW_MS)) {
        if (record.count >= Number(Bun.env.RATE_LIMIT)) {
            return new CORSResponse({
                success: false,
                message: "NO",
            },
            {
                status: 429,
                statusText: "Too Many Requests",
                headers: {
                    "Retry-After": (Number(Bun.env.RATE_WINDOW_MS) / 1000).toString(),
                    "X-RateLimit-Limit": Number(Bun.env.RATE_LIMIT).toString(),
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
