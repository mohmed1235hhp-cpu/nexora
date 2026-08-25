import type { HealthCheck, HealthResult } from "../types.js";
export interface QueueStats { pending: number; inFlight: number; failed: number; }
export class QueueHealth implements HealthCheck {
  readonly name = "queue";
  constructor(private readonly stats: () => Promise<QueueStats> | QueueStats, private readonly limits = { pending: 10000, failed: 500 }) {}
  async run(): Promise<HealthResult> {
    const s = await this.stats();
    const state = s.pending > this.limits.pending || s.failed > this.limits.failed ? "degraded" : "healthy";
    return { state, data: { ...s }, ts: Date.now(), durationMs: 0 };
  }
}
