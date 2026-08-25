import { AgentError, AgentErrorCode } from "../core/AgentErrors";
import { DEFAULT_RETRY_ATTEMPTS, DEFAULT_RETRY_DELAY_MS } from "../core/constants";

export class RetrySystem {
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = DEFAULT_RETRY_ATTEMPTS,
    delayMs: number = DEFAULT_RETRY_DELAY_MS,
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts) {
          await this.sleep(delayMs * attempt);
        }
      }
    }
    throw new AgentError(AgentErrorCode.RetryExhausted, `Failed after ${maxAttempts} attempts: ${String(lastError)}`);
  }

  async executeWithFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    try {
      return await primary();
    } catch {
      return await fallback();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
