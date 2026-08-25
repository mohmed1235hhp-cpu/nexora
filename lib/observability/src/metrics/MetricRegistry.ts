import { Registry } from "../core/Registry.js";
import type { Metric } from "./Metric.js";
import type { MetricSample } from "./types.js";
import { Counter } from "./Counter.js";
import { Gauge } from "./Gauge.js";
import { Histogram } from "./Histogram.js";
import { Summary } from "./Summary.js";
export class MetricRegistry extends Registry<Metric> {
  counter  (name: string, help?: string): Counter   { return this.getOrCreate(name, () => new Counter({ name, help })) as Counter; }
  gauge    (name: string, help?: string): Gauge     { return this.getOrCreate(name, () => new Gauge({ name, help }))     as Gauge; }
  histogram(name: string, help?: string, buckets?: readonly number[]): Histogram {
    return this.getOrCreate(name, () => new Histogram({ name, help, buckets })) as Histogram;
  }
  summary  (name: string, help?: string): Summary   { return this.getOrCreate(name, () => new Summary({ name, help }))   as Summary; }
  private getOrCreate<T extends Metric>(name: string, factory: () => T): T {
    const existing = this.get(name);
    if (existing) return existing as T;
    return this.register(factory()) as T;
  }
  collect(): readonly MetricSample[] {
    const out: MetricSample[] = [];
    for (const m of this.list()) out.push(...m.collect());
    return out;
  }
}
