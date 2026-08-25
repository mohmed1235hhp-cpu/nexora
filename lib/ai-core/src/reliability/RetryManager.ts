export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
}

export class RetryManager {
  async run<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
    const attempts = opts.attempts ?? 3;
    const base = opts.baseDelayMs ?? 200;
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, base * 2 ** i));
      }
    }
    throw lastErr;
  }
}
