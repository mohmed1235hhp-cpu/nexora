import type { AnalyticsAggregate, AnalyticsEvent, AnalyticsQuery, AnalyticsSink } from "./types.js";
export abstract class BaseAnalytics {
  constructor(protected readonly sink: AnalyticsSink, protected readonly domain: string) {}
  protected write(kind: string, data?: AnalyticsEvent["data"], userId?: string): void {
    void this.sink.write({ ts: Date.now(), kind, domain: this.domain, userId, data });
  }
  async aggregate(q: AnalyticsQuery = {}): Promise<AnalyticsAggregate> {
    const events = await this.sink.query({ ...q, domain: this.domain });
    const byKind: Record<string, number> = {}; const byDomain: Record<string, number> = {};
    let firstTs: number | undefined; let lastTs: number | undefined;
    for (const e of events) {
      byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
      byDomain[e.domain] = (byDomain[e.domain] ?? 0) + 1;
      if (firstTs === undefined || e.ts < firstTs) firstTs = e.ts;
      if (lastTs === undefined || e.ts > lastTs) lastTs = e.ts;
    }
    return { count: events.length, byKind, byDomain, firstTs, lastTs };
  }
}
