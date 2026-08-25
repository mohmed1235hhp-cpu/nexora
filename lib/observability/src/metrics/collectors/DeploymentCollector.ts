import type { MetricRegistry } from "../MetricRegistry.js";
import type { Counter } from "../Counter.js";
export class DeploymentCollector {
  readonly total: Counter;
  readonly failed: Counter;
  constructor(reg: MetricRegistry) {
    this.total  = reg.counter("deployments_total");
    this.failed = reg.counter("deployments_failed_total");
  }
  record(success: boolean): void { this.total.inc(); if (!success) this.failed.inc(); }
}
