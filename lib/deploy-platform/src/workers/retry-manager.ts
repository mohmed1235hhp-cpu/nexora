import type { BuildRequest } from '../types/build.js';
export interface RetryPolicy { readonly maxAttempts: number; readonly backoffMs: number; }
export class WorkerRetryManager {
  private attempts = new Map<string, number>();
  constructor(private policy: RetryPolicy = { maxAttempts: 3, backoffMs: 500 }) {}
  shouldRetry(request: BuildRequest): boolean {
    const n = (this.attempts.get(request.id) ?? 0) + 1;
    this.attempts.set(request.id, n);
    return n < this.policy.maxAttempts;
  }
  nextDelay(request: BuildRequest): number {
    const n = this.attempts.get(request.id) ?? 1;
    return this.policy.backoffMs * n;
  }
  reset(id: string): void { this.attempts.delete(id); }
}
