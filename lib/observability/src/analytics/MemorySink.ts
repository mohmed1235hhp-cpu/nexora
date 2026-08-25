import type { AnalyticsEvent, AnalyticsQuery, AnalyticsSink } from "./types.js";
export class MemoryAnalyticsSink implements AnalyticsSink {
  readonly name = "memory";
  private readonly events: AnalyticsEvent[] = [];
  constructor(private readonly capacity = 10_000) {}
  write(e: AnalyticsEvent): void { this.events.push(e); if (this.events.length > this.capacity) this.events.shift(); }
  query(q: AnalyticsQuery = {}): readonly AnalyticsEvent[] {
    return this.events.filter(e =>
      (q.kind === undefined || e.kind === q.kind) &&
      (q.domain === undefined || e.domain === q.domain) &&
      (q.from === undefined || e.ts >= q.from) &&
      (q.to === undefined || e.ts <= q.to));
  }
  clear(): void { this.events.length = 0; }
}
