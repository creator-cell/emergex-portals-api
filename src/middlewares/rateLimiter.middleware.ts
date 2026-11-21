import { Request, Response, NextFunction } from "express";
import IORedis from "ioredis";

/**
 * Redis-backed sliding-window rate limiter.
 *
 * Falls back to an in-memory store when Redis is unavailable,
 * so the app degrades gracefully rather than failing hard.
 *
 * Usage:
 *   router.post("/login", rateLimiter({ max: 10, windowMs: 60_000 }), loginController);
 */

let redisClient: IORedis | null = null;

function getRedis(): IORedis | null {
  if (redisClient) return redisClient;
  const uri = process.env.REDIS_URI || process.env.REDIS_URL;
  if (!uri) return null;
  try {
    redisClient = new IORedis(uri, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    redisClient.on("error", () => {
      // Silence Redis errors — we fall back to in-memory
    });
    return redisClient;
  } catch {
    return null;
  }
}

// In-memory fallback: Map<key, { count, resetAt }>
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Key prefix to separate different limiters */
  keyPrefix?: string;
  /** Custom key extractor — defaults to IP */
  keyExtractor?: (req: Request) => string;
  /** Response message */
  message?: string;
}

export const rateLimiter = (options: RateLimitOptions) => {
  const {
    max,
    windowMs,
    keyPrefix = "rl",
    keyExtractor = getClientIp,
    message = "Too many requests. Please try again later.",
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rawKey = keyExtractor(req);
    const key = `portals:${keyPrefix}:${rawKey}`;
    const windowSec = Math.ceil(windowMs / 1000);

    const redis = getRedis();

    try {
      let count: number;

      if (redis) {
        // Redis sliding window using INCR + EXPIRE
        count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, windowSec);
        }
      } else {
        // In-memory fallback
        const now = Date.now();
        const entry = inMemoryStore.get(key);
        if (!entry || entry.resetAt < now) {
          inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
          count = 1;
        } else {
          entry.count++;
          count = entry.count;
        }
      }

      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - count)));

      if (count > max) {
        res.setHeader("Retry-After", String(windowSec));
        res.status(429).json({ success: false, message });
        return;
      }
    } catch {
      // Never block a request due to rate-limiter errors
    }

    next();
  };
};

/** Pre-configured limiters for common use-cases */

/** Strict limiter for auth endpoints (login, register) */
export const authLimiter = rateLimiter({
  max: 10,
  windowMs: 60_000,
  keyPrefix: "auth",
  message: "Too many authentication attempts. Please wait 60 seconds.",
});

/** Standard limiter for write operations */
export const writeLimiter = rateLimiter({
  max: 60,
  windowMs: 60_000,
  keyPrefix: "write",
});

/** Strict limiter for expensive operations (PDF generation, report creation) */
export const heavyLimiter = rateLimiter({
  max: 10,
  windowMs: 60_000,
  keyPrefix: "heavy",
  message: "Too many resource-intensive requests. Please wait before trying again.",
});
