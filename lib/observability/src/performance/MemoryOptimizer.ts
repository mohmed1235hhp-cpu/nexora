export interface MemoryReport { rssBytes: number; heapUsedBytes: number; heapTotalBytes: number; externalBytes: number; }

export class MemoryOptimizer {
  snapshot(): MemoryReport {
    const p: any = (globalThis as any).process;
    const m = p?.memoryUsage?.() ?? { rss: 0, heapUsed: 0, heapTotal: 0, external: 0 };
    return { rssBytes: m.rss, heapUsedBytes: m.heapUsed, heapTotalBytes: m.heapTotal, externalBytes: m.external ?? 0 };
  }
  requestGc(): boolean {
    const gc = (globalThis as any).gc;
    if (typeof gc === "function") { gc(); return true; }
    return false;
  }
  pressure(): "low" | "medium" | "high" {
    const s = this.snapshot();
    const ratio = s.heapTotalBytes ? s.heapUsedBytes / s.heapTotalBytes : 0;
    if (ratio > 0.9) return "high"; if (ratio > 0.7) return "medium"; return "low";
  }
}
