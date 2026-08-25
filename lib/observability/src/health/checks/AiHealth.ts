import type { HealthCheck, HealthResult } from "../types.js";
export class AiHealth implements HealthCheck {
  readonly name = "ai";
  constructor(private readonly ping: () => Promise<{ ok: boolean; latencyMs?: number; provider?: string; error?: string }>) {}
  async run(): Promise<HealthResult> {
    const r = await this.ping();
    return {
      state: r.ok ? "healthy" : "degraded",
      message: r.error,
      data: {
        ...(r.latencyMs != null ? { latencyMs: r.latencyMs } : {}),
        ...(r.provider   != null ? { provider: r.provider }   : {}),
      },
      ts: Date.now(), durationMs: 0,
    };
  }
}
