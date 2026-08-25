export interface AnalyticsEvent {
  readonly ts: number;
  readonly kind: string;
  readonly domain: string;
  readonly userId?: string;
  readonly data?: Readonly<Record<string, string | number | boolean>>;
}
export interface AnalyticsQuery { readonly kind?: string; readonly from?: number; readonly to?: number; readonly domain?: string; }
export interface AnalyticsAggregate {
  readonly count: number;
  readonly byKind: Readonly<Record<string, number>>;
  readonly byDomain: Readonly<Record<string, number>>;
  readonly firstTs?: number;
  readonly lastTs?: number;
}
export interface AnalyticsSink {
  readonly name: string;
  write(event: AnalyticsEvent): void | Promise<void>;
  query(q?: AnalyticsQuery): readonly AnalyticsEvent[] | Promise<readonly AnalyticsEvent[]>;
}
