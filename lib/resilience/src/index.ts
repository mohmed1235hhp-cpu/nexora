/**
 * @workspace/resilience — auto-recovery primitives.
 *
 * `retry`   — exponential backoff + jitter, classify retryable errors
 * `timeout` — bounded async
 * `circuit` — circuit breaker with half-open probing
 * `failover`— run against a list of endpoints, promote the first healthy
 *
 * Zero deps. Server-side only. Complements @workspace/scalability.
 */

export interface RetryOpts {
  attempts?: number;
  baseMs?: number;
  maxMs?: number;
  factor?: number;
  jitter?: boolean;
  isRetryable?: (err: unknown) => boolean;
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
  signal?: AbortSignal;
}

export async function retry<T>(fn: () => Promise<T>, opts: RetryOpts = {}): Promise<T> {
  const attempts = opts.attempts ?? 5;
  const base = opts.baseMs ?? 200;
  const max = opts.maxMs ?? 10_000;
  const factor = opts.factor ?? 2;
  const isRetryable = opts.isRetryable ?? defaultRetryable;
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    if (opts.signal?.aborted) throw new Error("aborted");
    try { return await fn(); }
    catch (err: unknown) {
      lastErr = err;
      if (i === attempts || !isRetryable(err)) throw err;
      const backoff = Math.min(max, base * Math.pow(factor, i - 1));
      const delay = opts.jitter === false ? backoff : backoff * (0.5 + Math.random() * 0.5);
      opts.onRetry?.(err, i, delay);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw lastErr;
}

function defaultRetryable(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string })?.code ?? "";
  const status = (err as { status?: number; statusCode?: number })?.status
    ?? (err as { statusCode?: number })?.statusCode;
  if (status && (status === 408 || status === 425 || status === 429 || (status >= 500 && status < 600))) return true;
  if (["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "EAI_AGAIN", "EPIPE", "ENETUNREACH", "UND_ERR_SOCKET"].includes(code)) return true;
  if (/timeout|temporar|unavailable|reset|EAI_AGAIN|socket hang up|network/i.test(msg)) return true;
  return false;
}

/* ---------------- timeout ---------------- */

export async function timeout<T>(promise: Promise<T>, ms: number, label = "operation"): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

/* ---------------- circuit breaker ---------------- */

type CircuitState = "closed" | "open" | "half-open";
export interface CircuitOpts {
  failureThreshold?: number;
  successThreshold?: number;
  openMs?: number;
}

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private successes = 0;
  private openedAt = 0;
  constructor(private readonly opts: Required<CircuitOpts>) {}

  static create(opts: CircuitOpts = {}): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: opts.failureThreshold ?? 5,
      successThreshold: opts.successThreshold ?? 2,
      openMs: opts.openMs ?? 30_000,
    });
  }

  get status(): CircuitState { return this.state; }

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.openedAt >= this.opts.openMs) this.state = "half-open";
      else throw new Error("circuit_open");
    }
    try {
      const out = await fn();
      this.onSuccess();
      return out;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    if (this.state === "half-open") {
      this.successes++;
      if (this.successes >= this.opts.successThreshold) this.reset();
    } else this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.successes = 0;
    if (this.state === "half-open" || this.failures >= this.opts.failureThreshold) {
      this.state = "open";
      this.openedAt = Date.now();
    }
  }

  private reset(): void {
    this.state = "closed"; this.failures = 0; this.successes = 0;
  }
}

/* ---------------- failover ---------------- */

/**
 * Try each provider in order. First non-throwing one wins.
 * Providers are wrapped in per-target circuit breakers so a dead one
 * short-circuits fast on subsequent calls.
 */
export function makeFailover<T, P>(
  providers: Array<{ name: string; provider: P; }>,
  invoke: (p: P, input: T) => Promise<unknown>,
  circuitOpts?: CircuitOpts,
) {
  const breakers = new Map(providers.map(p => [p.name, CircuitBreaker.create(circuitOpts)]));
  return async (input: T) => {
    let lastErr: unknown;
    for (const { name, provider } of providers) {
      const b = breakers.get(name)!;
      try { return await b.exec(() => invoke(provider, input)); }
      catch (err) { lastErr = err; }
    }
    throw lastErr ?? new Error("all_providers_failed");
  };
}
