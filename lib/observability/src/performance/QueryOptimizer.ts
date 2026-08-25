export interface QuerySample { readonly sql: string; readonly durationMs: number; readonly ts?: number; }
export interface QueryReport {
  count: number; totalMs: number; avgMs: number; p95Ms: number;
  slowest: readonly QuerySample[];
}
export class QueryOptimizer {
  private readonly samples: QuerySample[] = [];
  record(s: QuerySample): void { this.samples.push({ ...s, ts: s.ts ?? Date.now() }); if (this.samples.length > 1000) this.samples.shift(); }
  report(topN = 5): QueryReport {
    const s = [...this.samples].sort((a, b) => a.durationMs - b.durationMs);
    const total = s.reduce((a, b) => a + b.durationMs, 0);
    const p95 = s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]!.durationMs : 0;
    return { count: s.length, totalMs: total, avgMs: s.length ? total / s.length : 0, p95Ms: p95, slowest: [...s].reverse().slice(0, topN) };
  }
  clear(): void { this.samples.length = 0; }
}
