import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash =
    !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash
    ? new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

//Different limits for different endpoints
export const rateLimiters = hasUpstash
    ? {
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
              prefix: "ratelimit:upload",
              analytics: true,
          }),

          // Ingest: learning-inbox captures trigger fetch + AI extraction
          ingest: new Ratelimit({
              redis,
              limiter: Ratelimit.slidingWindow(30, "1 h"),
              prefix: "ratelimit:ingest",
              analytics: true,
          }),
      }
    : null;

let warnedOnce = false;

// Helper function - use in any route
export async function checkRateLimit(request, limiterType = "api") {
    // Fail open in local/dev setups without Upstash so the app still works,
    // but never silently in production.
    if (!rateLimiters) {
        if (!warnedOnce) {
            warnedOnce = true;
            const msg =
                "Rate limiting disabled: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set";
            if (process.env.NODE_ENV === "production") console.error(msg);
            else console.warn(msg);
        }
        return { success: true, limit: 0, remaining: 0, reset: 0 };
    }

    // x-forwarded-for may be a comma-separated chain; the first hop is the client
    const forwarded = request.headers.get("x-forwarded-for");
    const ip =
        (forwarded ? forwarded.split(",")[0].trim() : null) ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1";

    try {
        const { success, limit, remaining, reset } =
            await rateLimiters[limiterType].limit(ip);
        return { success, limit, remaining, reset };
    } catch (error) {
        // Redis outage should not take the whole API down
        console.error("Rate limit check failed:", error.message);
        return { success: true, limit: 0, remaining: 0, reset: 0 };
    }
}
