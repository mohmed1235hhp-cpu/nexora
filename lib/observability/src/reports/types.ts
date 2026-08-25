import type { HealthSnapshot } from "../health/types.js";
import type { MetricSample } from "../metrics/types.js";
import type { AnalyticsAggregate } from "../analytics/types.js";

export type ReportPeriod = "daily" | "weekly" | "monthly" | "adhoc";
export type ReportKind = "system" | "performance" | "security" | "usage" | "ai";

export interface ReportInput {
  readonly period: ReportPeriod;
  readonly kind: ReportKind;
  readonly generatedAt: number;
  readonly health?: HealthSnapshot;
  readonly metrics?: readonly MetricSample[];
  readonly analytics?: AnalyticsAggregate;
  readonly extra?: Readonly<Record<string, string | number | boolean>>;
}

export interface Report {
  readonly id: string;
  readonly period: ReportPeriod;
  readonly kind: ReportKind;
  readonly generatedAt: number;
  readonly markdown: string;
  readonly json: Readonly<Record<string, unknown>>;
}
