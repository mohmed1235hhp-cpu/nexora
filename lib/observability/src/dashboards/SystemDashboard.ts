import type { DashboardData } from "./types.js";
import type { HealthRunner } from "../health/HealthRunner.js";
import type { MetricRegistry } from "../metrics/MetricRegistry.js";
import type { MemorySink } from "../logging/sinks/MemorySink.js";
export class SystemDashboard {
  constructor(
    private readonly health: HealthRunner,
    private readonly metrics: MetricRegistry,
    private readonly logs: MemorySink,
    public readonly recentLogsLimit = 100,
  ) {}
  async render(): Promise<DashboardData> {
    const snap = await this.health.runAll();
    const all  = this.logs.snapshot();
    return {
      generatedAt: Date.now(),
      health: snap,
      metrics: this.metrics.collect(),
      recentLogs: all.slice(-this.recentLogsLimit),
    };
  }
}
