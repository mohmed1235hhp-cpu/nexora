import { MemoryOptimizer } from "./MemoryOptimizer.js";
import { CpuOptimizer } from "./CpuOptimizer.js";
import { CachingLayer } from "./CachingLayer.js";
import { CompressionLayer } from "./CompressionLayer.js";
import { QueryOptimizer } from "./QueryOptimizer.js";
import { BundleOptimizer } from "./BundleOptimizer.js";
import type { PerformanceSnapshot } from "./types.js";

export class PerformanceManager {
  readonly memory = new MemoryOptimizer();
  readonly cpu = new CpuOptimizer();
  readonly cache: CachingLayer;
  readonly compression = new CompressionLayer();
  readonly queries = new QueryOptimizer();
  readonly bundle = new BundleOptimizer();
  constructor(cache: CachingLayer = new CachingLayer()) { this.cache = cache; }

  snapshot(): PerformanceSnapshot {
    const m = this.memory.snapshot();
    const c = this.cpu.snapshot();
    const s = this.cache.stats();
    return {
      ts: Date.now(),
      memory: { rssBytes: m.rssBytes, heapUsedBytes: m.heapUsedBytes, heapTotalBytes: m.heapTotalBytes },
      cpu:    { userMs: c.userMs, systemMs: c.systemMs, loadAvg: c.loadAvg },
      cache:  { size: s.size, hits: s.hits, misses: s.misses, hitRate: s.hitRate },
    };
  }
}
