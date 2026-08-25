export interface PerformanceSnapshot {
  readonly ts: number;
  readonly memory: { rssBytes: number; heapUsedBytes: number; heapTotalBytes: number };
  readonly cpu:    { userMs: number; systemMs: number; loadAvg?: readonly number[] };
  readonly cache:  { size: number; hits: number; misses: number; hitRate: number };
}
export interface CacheEntry<V> { value: V; expiresAt: number; }
export interface CacheStats { size: number; hits: number; misses: number; hitRate: number; }
