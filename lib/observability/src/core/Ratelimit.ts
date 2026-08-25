/** Token bucket rate-limiter shared by log/alert paths. */
export class TokenBucket {
  private tokens: number;
  private last: number;
  constructor(
    public readonly capacity: number,
    public readonly refillPerSec: number,
    now: () => number = () => Date.now(),
    private readonly clock = now,
  ) { this.tokens = capacity; this.last = clock(); }
  tryConsume(n = 1): boolean {
    const now = this.clock();
    const elapsed = (now - this.last) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSec);
    this.last = now;
    if (this.tokens >= n) { this.tokens -= n; return true; }
    return false;
  }
  available(): number { return this.tokens; }
}
