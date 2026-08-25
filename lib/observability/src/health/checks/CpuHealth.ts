import type { HealthCheck, HealthResult } from "../types.js";
/** Best-effort CPU probe using process.cpuUsage() between two samples. */
export class CpuHealth implements HealthCheck {
  readonly name = "cpu";
  private last?: { user: number; system: number; at: number };
  constructor(public readonly warnPct = 85) {}
  async run(): Promise<HealthResult> {
    if (typeof process === "undefined" || !process.cpuUsage) {
      return { state: "unknown", ts: Date.now(), durationMs: 0 };
    }
    const now = process.cpuUsage();
    const at  = Date.now();
    if (!this.last) { this.last = { user: now.user, system: now.system, at }; return { state: "unknown", ts: at, durationMs: 0 }; }
    const elapsedUs = (at - this.last.at) * 1000;
    const usedUs    = (now.user - this.last.user) + (now.system - this.last.system);
    const pct = elapsedUs > 0 ? Math.min(100, Math.max(0, (usedUs / elapsedUs) * 100)) : 0;
    this.last = { user: now.user, system: now.system, at };
    return { state: pct > this.warnPct ? "degraded" : "healthy", data: { pct: Math.round(pct) }, ts: at, durationMs: 0 };
  }
}
