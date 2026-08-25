import { Metric } from "./Metric.js";
import type { MetricKind, MetricSample, HistogramSnapshot } from "./types.js";

const DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000] as const;

export class Histogram extends Metric {
  readonly kind: MetricKind = "histogram";
  private readonly buckets: number[];
  private counts: number[];
  private count = 0;
  private sum = 0;
  private min = Number.POSITIVE_INFINITY;
  private max = Number.NEGATIVE_INFINITY;
  constructor(meta: { name: string; help?: string; unit?: string; buckets?: readonly number[] }) {
    super(meta);
    this.buckets = [...(meta.buckets ?? DEFAULT_BUCKETS)].sort((a, b) => a - b);
    this.counts = new Array(this.buckets.length).fill(0);
  }
  observe(v: number): void {
    this.count += 1; this.sum += v;
    if (v < this.min) this.min = v;
    if (v > this.max) this.max = v;
    for (let i = 0; i < this.buckets.length; i++) if (v <= this.buckets[i]) this.counts[i] += 1;
  }
  snapshot(): HistogramSnapshot {
    return {
      count: this.count, sum: this.sum,
      min: this.count === 0 ? 0 : this.min,
      max: this.count === 0 ? 0 : this.max,
      buckets: this.buckets.map((le, i) => ({ le, count: this.counts[i] })),
    };
  }
  reset(): void { this.count = 0; this.sum = 0; this.min = Infinity; this.max = -Infinity; this.counts = new Array(this.buckets.length).fill(0); }
  collect(): readonly MetricSample[] {
    const ts = Date.now();
    return [
      { name: `${this.name}_count`, kind: this.kind, value: this.count, ts },
      { name: `${this.name}_sum`,   kind: this.kind, value: this.sum,   ts },
    ];
  }
}
