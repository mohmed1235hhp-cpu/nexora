import type { PerformanceManager } from "../performance/PerformanceManager.js";
export class PerformanceDashboard {
  constructor(private readonly perf: PerformanceManager) {}
  render() { return { generatedAt: Date.now(), snapshot: this.perf.snapshot(), queries: this.perf.queries.report() }; }
}
