import type { CacheEntry, CacheStats } from "./types.js";

export interface CachingOptions { readonly maxSize?: number; readonly defaultTtlMs?: number; }

/** LRU + TTL cache with stampede protection (single-flight per key). */
export class CachingLayer<V = unknown> {
  private readonly map = new Map<string, CacheEntry<V>>();
  private readonly inflight = new Map<string, Promise<V>>();
  private hits = 0; private misses = 0;
  constructor(private readonly opts: CachingOptions = {}) {}

  private evictIfNeeded() {
    const max = this.opts.maxSize ?? 1000;
    while (this.map.size > max) { const k = this.map.keys().next().value; if (k === undefined) break; this.map.delete(k); }
  }

  get(key: string): V | undefined {
    const e = this.map.get(key);
    if (!e) { this.misses++; return undefined; }
    if (e.expiresAt <= Date.now()) { this.map.delete(key); this.misses++; return undefined; }
    // LRU touch
    this.map.delete(key); this.map.set(key, e);
    this.hits++;
    return e.value;
  }
  set(key: string, value: V, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.opts.defaultTtlMs ?? 60_000);
    this.map.delete(key); this.map.set(key, { value, expiresAt });
    this.evictIfNeeded();
  }
  async getOrLoad(key: string, loader: () => Promise<V>, ttlMs?: number): Promise<V> {
    const cached = this.get(key); if (cached !== undefined) return cached;
    const inflight = this.inflight.get(key); if (inflight) return inflight;
    const p = (async () => {
      try { const v = await loader(); this.set(key, v, ttlMs); return v; }
      finally { this.inflight.delete(key); }
    })();
    this.inflight.set(key, p);
    return p;
  }
  invalidate(key?: string): void { if (key) this.map.delete(key); else this.map.clear(); }
  stats(): CacheStats {
    const total = this.hits + this.misses;
    return { size: this.map.size, hits: this.hits, misses: this.misses, hitRate: total ? this.hits / total : 0 };
  }
}
