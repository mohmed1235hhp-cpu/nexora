import { Metric } from "./Metric.js";
import type { MetricKind, MetricSample } from "./types.js";
export class Summary extends Metric {
  readonly kind: MetricKind = "summary";
  private readonly window: number[] = [];
  constructor(meta: { name: string; help?: string; unit?: string }, public readonly capacity = 1000) { super(meta); }
  observe(v: number): void { this.window.push(v); if (this.window.length > this.capacity) this.window.shift(); }
  quantile(q: number): number {
    if (this.window.length === 0) return 0;
    const sorted = [...this.window].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)));
    return sorted[idx];
  }
  collect(): readonly MetricSample[] {
    const ts = Date.now();
    return [
      { name: `${this.name}_p50`, kind: this.kind, value: this.quantile(0.5),  ts },
      { name: `${this.name}_p95`, kind: this.kind, value: this.quantile(0.95), ts },
      { name: `${this.name}_p99`, kind: this.kind, value: this.quantile(0.99), ts },
    ];
  }
}
