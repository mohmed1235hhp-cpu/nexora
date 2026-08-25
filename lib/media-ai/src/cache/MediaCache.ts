export interface CacheEntry<V> { value: V; expiresAt: number; }
export interface IMediaCache<V = unknown> {
  get(key: string): V | undefined;
  set(key: string, value: V, ttlMs?: number): void;
  delete(key: string): void;
  clear(): void;
}
export class InMemoryMediaCache<V = unknown> implements IMediaCache<V> {
  private store = new Map<string, CacheEntry<V>>();
  constructor(private readonly defaultTtlMs = 5 * 60_000) {}
  get(key: string): V | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (e.expiresAt < Date.now()) { this.store.delete(key); return undefined; }
    return e.value;
  }
  set(key: string, value: V, ttlMs?: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) });
  }
  delete(key: string): void { this.store.delete(key); }
  clear(): void { this.store.clear(); }
}
