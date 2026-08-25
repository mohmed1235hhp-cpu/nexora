import type { MetricKind, MetricMeta, MetricSample } from "./types.js";
import type { Tags } from "../core/types.js";
export abstract class Metric implements MetricMeta {
  readonly name: string;
  readonly help?: string;
  readonly unit?: string;
  abstract readonly kind: MetricKind;
  constructor(meta: Omit<MetricMeta, "kind">) {
    this.name = meta.name; this.help = meta.help; this.unit = meta.unit;
  }
  abstract collect(): readonly MetricSample[];
  protected tagKey(tags?: Tags): string {
    if (!tags) return "";
    const keys = Object.keys(tags).sort();
    return keys.map((k) => `${k}=${tags[k]}`).join(",");
  }
}
