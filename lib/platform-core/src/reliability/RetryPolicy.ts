/**
 * Retry with exponential backoff + jitter.
 */
export interface RetryConfig {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly jitter: number; // 0..1
}

export const defaultRetry: RetryConfig = {
  maxAttempts: 2, // 1 retry per spec ("Retry once")
  baseDelayMs: 200,
  maxDelayMs: 4_000,
  jitter: 0.3,
};

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  cfg: RetryConfig = defaultRetry,
  signal?: AbortSignal,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    if (signal?.aborted) throw new Error("aborted");
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (attempt >= cfg.maxAttempts) break;
      const backoff = Math.min(cfg.baseDelayMs * 2 ** (attempt - 1), cfg.maxDelayMs);
      const jitterMs = backoff * cfg.jitter * Math.random();
      await new Promise<void>((r) => setTimeout(r, backoff + jitterMs));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
