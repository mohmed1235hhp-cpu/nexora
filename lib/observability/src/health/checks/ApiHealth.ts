import type { HealthCheck, HealthResult } from "../types.js";
export class ApiHealth implements HealthCheck {
  readonly name = "api";
  constructor(private readonly probe: () => Promise<{ ok: boolean; status?: number; latencyMs?: number }>) {}
  async run(): Promise<HealthResult> {
    const r = await this.probe();
    return {
      state: r.ok ? "healthy" : "unhealthy",
      data: {
        ...(r.status    != null ? { status: r.status }       : {}),
        ...(r.latencyMs != null ? { latencyMs: r.latencyMs } : {}),
      },
      ts: Date.now(), durationMs: 0,
    };
  }
}
