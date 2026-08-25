/**
 * Simple circuit breaker per key (agent id / capability).
 * States: closed → open (on threshold failures) → half-open (after cool-down) → closed.
 */
export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitConfig {
  readonly failureThreshold: number;
  readonly cooldownMs: number;
  readonly halfOpenMaxCalls: number;
}

interface Bucket {
  state: CircuitState;
  failures: number;
  openedAt: number;
  halfOpenCalls: number;
}

export class CircuitBreaker {
  private readonly buckets = new Map<string, Bucket>();
  constructor(private readonly cfg: CircuitConfig = { failureThreshold: 5, cooldownMs: 30_000, halfOpenMaxCalls: 1 }) {}

  private bucket(key: string): Bucket {
    let b = this.buckets.get(key);
    if (!b) {
      b = { state: "closed", failures: 0, openedAt: 0, halfOpenCalls: 0 };
      this.buckets.set(key, b);
    }
    return b;
  }

  canPass(key: string): boolean {
    const b = this.bucket(key);
    if (b.state === "closed") return true;
    if (b.state === "open") {
      if (Date.now() - b.openedAt >= this.cfg.cooldownMs) {
        b.state = "half-open";
        b.halfOpenCalls = 0;
      } else return false;
    }
    // half-open
    if (b.halfOpenCalls < this.cfg.halfOpenMaxCalls) {
      b.halfOpenCalls += 1;
      return true;
    }
    return false;
  }

  reportSuccess(key: string): void {
    const b = this.bucket(key);
    b.failures = 0;
    b.state = "closed";
    b.halfOpenCalls = 0;
  }

  reportFailure(key: string): void {
    const b = this.bucket(key);
    b.failures += 1;
    if (b.failures >= this.cfg.failureThreshold) {
      b.state = "open";
      b.openedAt = Date.now();
    }
  }

  state(key: string): CircuitState {
    return this.bucket(key).state;
  }

  snapshot(): Readonly<Record<string, CircuitState>> {
    const out: Record<string, CircuitState> = {};
    for (const [k, b] of this.buckets) out[k] = b.state;
    return out;
  }
}
