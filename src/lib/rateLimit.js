import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

//Different limits for different endpoints
export const rateLimiters = {
    //Auth: strict - 5 attempts per 15 minutes per IP
    auth: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "ratelimit:auth",
        analytics: true,
    }),

    //API: moderate - 60 requests per minute per Ip
    api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, "1 m"),
        prefix: "ratelimit:api",
        analytics: true,
    }),

    // Upload: strict - 10 uploads per hour per user
    upload: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        prefix: "ratelimit: upload",
        analytics: true,
    }),
}

// Helper function - use in any route
export async function checkRateLimit(request, limiterType = "api") {
    const ip = 
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1"


const { success, limit, remaining, reset }=
    await rateLimiters[limiterType].limit(ip)

return {success,limit,remaining, reset}
}