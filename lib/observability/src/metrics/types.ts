import type { Tags, Timestamp } from "../core/types.js";
export type MetricKind = "counter" | "gauge" | "histogram" | "summary";
export interface MetricMeta { name: string; help?: string; unit?: string; kind: MetricKind; }
export interface MetricSample { name: string; kind: MetricKind; value: number; ts: Timestamp; tags?: Tags; }
export interface HistogramSnapshot {
  count: number; sum: number; min: number; max: number;
  buckets: readonly { le: number; count: number }[];
  quantiles?: Readonly<Record<string, number>>;
}
