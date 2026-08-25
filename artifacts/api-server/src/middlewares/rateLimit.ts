/**
 * Phase 14/15 — Rate Limiting & Spam Protection
 *
 * Redis-backed sliding-window counter when REDIS_URL is configured (required
 * for correctness once the API runs more than one instance — an in-memory
 * Map counts each process separately, silently multiplying every limit by
 * the instance count). Falls back to the original in-memory Map for local
 * dev, and degrades to the in-memory store (never to "no limiting") if the
 * Redis client is unavailable at runtime, so a Redis outage narrows
 * protection instead of removing it.
 */
import { Request, Response, NextFunction } from "express";
import { type AuthRequest } from "./auth";

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitStore>();

// Cleanup stale entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetAt < now) memoryStore.delete(key);
  }
}, 60_000);

function checkInMemory(key: string, windowMs: number, max: number, now: number) {
  let entry = memoryStore.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    memoryStore.set(key, entry);
  }
  entry.count++;
  return { count: entry.count, resetAt: entry.resetAt };
}

// Lazily created shared ioredis client. `null` means "not attempted yet",
// `false` means "attempted and unavailable" (package missing or REDIS_URL
// unset) — from then on every request just uses the in-memory fallback
// without retrying the dynamic import on every call.
let redisClient: import("ioredis").Redis | null | false = null;

async function getRedisClient() {
  if (redisClient !== null) return redisClient || null;
  if (!process.env.REDIS_URL) {
    redisClient = false;
    return null;
  }
  try {
    const { default: IORedis } = await import("ioredis");
    const client = new IORedis(process.env.REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      lazyConnect: false,
    });
    client.on("error", () => {
      // Swallow — a transient Redis error just means the next call() below
      // falls back to in-memory for that request; ioredis logs internally.
    });
    redisClient = client;
    return client;
  } catch {
    redisClient = false;
    return null;
  }
}

async function checkInRedis(key: string, windowMs: number, now: number) {
  const client = await getRedisClient();
  if (!client) return null;
  try {
    const multi = client.multi();
    multi.incr(key);
    multi.pttl(key);
    const results = await multi.exec();
    if (!results) return null;

    const count = Number(results[0]?.[1] ?? 0);
    let ttl = Number(results[1]?.[1] ?? -1);

    if (count === 1 || ttl < 0) {
      await client.pexpire(key, windowMs);
      ttl = windowMs;
    }

    return { count, resetAt: now + ttl };
  } catch {
    // Redis reachable but the command failed (e.g. connection drop mid-flight)
    // — fall back to in-memory for this request rather than failing open.
    return null;
  }
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  message?: string;
}) {
  const { windowMs, max, keyPrefix = "rl", message = "Too many requests, please try again later" } = options;

  return async (req: Request & AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;
    const ip = req.ip ?? "unknown";
    const key = `${keyPrefix}:${userId ?? ip}`;
    const now = Date.now();

    const result = (await checkInRedis(key, windowMs, now)) ?? checkInMemory(key, windowMs, max, now);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - result.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000));

    if (result.count > max) {
      res.setHeader("Retry-After", Math.ceil((result.resetAt - now) / 1000));
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}

// Preset limiters
export const apiLimiter = createRateLimiter({ windowMs: 60_000, max: 200, keyPrefix: "api" });
export const authLimiter = createRateLimiter({ windowMs: 60_000, max: 10, keyPrefix: "auth", message: "Too many auth attempts" });
export const uploadLimiter = createRateLimiter({ windowMs: 60_000, max: 20, keyPrefix: "upload" });
export const reportLimiter = createRateLimiter({ windowMs: 3600_000, max: 20, keyPrefix: "report", message: "Report limit reached" });
