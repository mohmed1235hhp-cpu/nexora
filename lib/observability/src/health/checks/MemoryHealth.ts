import type { HealthCheck, HealthResult } from "../types.js";
export class MemoryHealth implements HealthCheck {
  readonly name = "memory";
  constructor(public readonly maxRssMB = 1024) {}
  run(): HealthResult {
    const mu = typeof process !== "undefined" && process.memoryUsage ? process.memoryUsage() : undefined;
    if (!mu) return { state: "unknown", ts: Date.now(), durationMs: 0 };
    const rssMB = Math.round(mu.rss / 1024 / 1024);
    const heapMB = Math.round(mu.heapUsed / 1024 / 1024);
    const state = rssMB > this.maxRssMB ? "degraded" : "healthy";
    return { state, data: { rssMB, heapMB }, ts: Date.now(), durationMs: 0 };
  }
}
