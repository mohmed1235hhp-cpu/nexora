import type { MetricRegistry } from "../MetricRegistry.js";
import type { Counter } from "../Counter.js";
import type { Histogram } from "../Histogram.js";
export class BuildCollector {
  readonly total: Counter;
  readonly failed: Counter;
  readonly duration: Histogram;
  constructor(reg: MetricRegistry) {
    this.total    = reg.counter("builds_total");
    this.failed   = reg.counter("builds_failed_total");
    this.duration = reg.histogram("build_duration_ms");
  }
  record(success: boolean, durationMs: number): void {
    this.total.inc();
    if (!success) this.failed.inc();
    this.duration.observe(durationMs);
  }
}
