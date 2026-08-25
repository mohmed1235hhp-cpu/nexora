import { Metric } from "./Metric.js";
import type { MetricKind, MetricSample } from "./types.js";
import type { Tags } from "../core/types.js";
export class Gauge extends Metric {
  readonly kind: MetricKind = "gauge";
  private readonly values = new Map<string, { tags?: Tags; value: number }>();
  set(value: number, tags?: Tags): void { this.values.set(this.tagKey(tags), { tags, value }); }
  inc(delta = 1, tags?: Tags): void {
    const key = this.tagKey(tags);
    const cur = this.values.get(key) ?? { tags, value: 0 };
    cur.value += delta; this.values.set(key, cur);
  }
  dec(delta = 1, tags?: Tags): void { this.inc(-delta, tags); }
  collect(): readonly MetricSample[] {
    const ts = Date.now();
    return Array.from(this.values.values()).map((v) => ({ name: this.name, kind: this.kind, value: v.value, ts, tags: v.tags }));
  }
}
