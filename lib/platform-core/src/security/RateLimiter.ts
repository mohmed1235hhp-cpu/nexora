/**
 * Token-bucket rate limiter keyed by principal / IP / agent.
 */
export interface RateLimitConfig {
  readonly capacity: number;
  readonly refillPerSec: number;
}

interface Bucket {
  tokens: number;
  updated: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  constructor(private readonly cfg: RateLimitConfig = { capacity: 30, refillPerSec: 1 }) {}

  tryConsume(key: string, cost = 1): boolean {
    const now = Date.now() / 1000;
    let b = this.buckets.get(key);
    if (!b) {
      b = { tokens: this.cfg.capacity, updated: now };
      this.buckets.set(key, b);
    }
    const elapsed = now - b.updated;
    b.tokens = Math.min(this.cfg.capacity, b.tokens + elapsed * this.cfg.refillPerSec);
    b.updated = now;
    if (b.tokens < cost) return false;
    b.tokens -= cost;
    return true;
  }
}
