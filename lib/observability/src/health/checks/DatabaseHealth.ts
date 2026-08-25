import type { HealthCheck, HealthResult } from "../types.js";
export class DatabaseHealth implements HealthCheck {
  readonly name = "database";
  readonly critical = true;
  constructor(private readonly ping: () => Promise<{ ok: boolean; latencyMs?: number; error?: string }>) {}
  async run(): Promise<HealthResult> {
    const r = await this.ping();
    return {
      state: r.ok ? (r.latencyMs && r.latencyMs > 500 ? "degraded" : "healthy") : "unhealthy",
      message: r.error, data: r.latencyMs != null ? { latencyMs: r.latencyMs } : undefined,
      ts: Date.now(), durationMs: 0,
    };
  }
}
