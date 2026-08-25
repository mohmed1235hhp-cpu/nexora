import type { HealthCheck, HealthResult } from "../types.js";
export interface WorkerStats { total: number; busy: number; idle: number; failed: number; }
export class WorkerHealth implements HealthCheck {
  readonly name = "worker";
  constructor(private readonly stats: () => Promise<WorkerStats> | WorkerStats) {}
  async run(): Promise<HealthResult> {
    const s = await this.stats();
    const state = s.total === 0 ? "unhealthy" : s.failed > 0 && s.idle === 0 ? "degraded" : "healthy";
    return { state, data: { ...s }, ts: Date.now(), durationMs: 0 };
  }
}
