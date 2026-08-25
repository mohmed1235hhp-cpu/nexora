import type { HealthCheck, HealthResult } from "../types.js";
export class StorageHealth implements HealthCheck {
  readonly name = "storage";
  constructor(private readonly ping: () => Promise<{ ok: boolean; freeBytes?: number; error?: string }>) {}
  async run(): Promise<HealthResult> {
    const r = await this.ping();
    return {
      state: r.ok ? "healthy" : "unhealthy",
      message: r.error,
      data: r.freeBytes != null ? { freeBytes: r.freeBytes } : undefined,
      ts: Date.now(), durationMs: 0,
    };
  }
}
