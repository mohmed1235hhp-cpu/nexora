import type { RateLimitDecision } from "./types.js";
import { systemClock, type Clock } from "../core/Clock.js";

export interface RateLimitConfig {
  readonly capacity: number;      // token bucket capacity
  readonly refillPerSec: number;  // tokens per second
  readonly windowMs?: number;     // sliding window size, defaults to 60_000
  readonly maxInWindow?: number;  // sliding window cap
}

interface Bucket { tokens: number; last: number; hits: number[]; }

/** Hybrid token-bucket + sliding-window rate limiter, per-key. */
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  constructor(private readonly cfg: RateLimitConfig, private readonly clock: Clock = systemClock) {}

  check(key: string, cost = 1): RateLimitDecision {
    const now = this.clock.now();
    const b = this.buckets.get(key) ?? { tokens: this.cfg.capacity, last: now, hits: [] };
    // refill
    const elapsed = Math.max(0, now - b.last) / 1000;
    b.tokens = Math.min(this.cfg.capacity, b.tokens + elapsed * this.cfg.refillPerSec);
    b.last = now;
    // sliding window
    const win = this.cfg.windowMs ?? 60_000;
    b.hits = b.hits.filter(t => now - t < win);
    const maxWin = this.cfg.maxInWindow ?? Number.POSITIVE_INFINITY;

    const allowed = b.tokens >= cost && b.hits.length < maxWin;
    if (allowed) { b.tokens -= cost; b.hits.push(now); }
    this.buckets.set(key, b);
    const retryAfterMs = allowed ? undefined :
      Math.max(1, Math.ceil(((cost - b.tokens) / Math.max(0.001, this.cfg.refillPerSec)) * 1000));
    return { allowed, remaining: Math.floor(b.tokens), resetAt: now + Math.ceil((this.cfg.capacity / this.cfg.refillPerSec) * 1000), retryAfterMs };
  }

  reset(key?: string): void { if (key) this.buckets.delete(key); else this.buckets.clear(); }
  size(): number { return this.buckets.size; }
}
