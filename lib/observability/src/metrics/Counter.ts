import { Metric } from "./Metric.js";
import type { MetricKind, MetricSample } from "./types.js";
import type { Tags } from "../core/types.js";
export class Counter extends Metric {
  readonly kind: MetricKind = "counter";
  private readonly values = new Map<string, { tags?: Tags; value: number }>();
  inc(delta = 1, tags?: Tags): void {
    if (delta < 0) throw new Error(`Counter '${this.name}' cannot decrease`);
    const key = this.tagKey(tags);
    const cur = this.values.get(key) ?? { tags, value: 0 };
    cur.value += delta; this.values.set(key, cur);
  }
  reset(): void { this.values.clear(); }
  collect(): readonly MetricSample[] {
    const ts = Date.now();
    return Array.from(this.values.values()).map((v) => ({ name: this.name, kind: this.kind, value: v.value, ts, tags: v.tags }));
  }
}
