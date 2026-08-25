/**
 * @workspace/cache — Redis-ready cache abstraction.
 *
 * Design goals
 * ------------
 * 1. Same call sites work whether the project has Redis or not.
 * 2. Zero config in dev — falls back to an in-memory LRU + TTL store.
 * 3. Turning Redis on is a single env var (`REDIS_URL`) plus one factory swap
 *    in the composition root. No route/handler changes required.
 * 4. Namespaced keys so scaling to millions of users cannot collide.
 *
 * Cache use-cases already covered by the API:
 *   - Frequently-used queries (feed slices, trending, leaderboard snapshots)
 *   - Session lookups (short TTL)
 *   - Rate-limit counters (via `incrWithTtl`)
 *   - Read-through wrapper `remember()` for expensive DB calls
 *
 * NOTE: no direct `ioredis` import — that keeps this package usable in the
 * Cloudflare Worker runtime and lets us install ioredis only inside the Node
 * process that actually uses it.
 */

export interface CacheClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  incrWithTtl(key: string, ttlSeconds: number): Promise<number>;
  /** Returns cached value if fresh; otherwise loads, stores, and returns. */
  remember<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T>;
  /** Best-effort invalidate all keys matching prefix. */
  invalidatePrefix(prefix: string): Promise<void>;
}

interface Entry {
  value: unknown;
  expiresAt: number; // epoch ms, 0 = no expiry
}

class InMemoryCache implements CacheClient {
  private store = new Map<string, Entry>();
  private maxEntries: number;

  constructor(maxEntries = 10_000) {
    this.maxEntries = maxEntries;
  }

  private evictIfNeeded() {
    if (this.store.size <= this.maxEntries) return;
    // Evict oldest ~10% (Map preserves insertion order)
    const toDrop = Math.ceil(this.maxEntries * 0.1);
    let i = 0;
    for (const k of this.store.keys()) {
      if (i++ >= toDrop) break;
      this.store.delete(k);
    }
  }

  private isExpired(e: Entry): boolean {
    return e.expiresAt !== 0 && e.expiresAt < Date.now();
  }

  async get<T>(key: string): Promise<T | null> {
    const e = this.store.get(key);
    if (!e) return null;
    if (this.isExpired(e)) {
      this.store.delete(key);
      return null;
    }
    return e.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0,
    });
    this.evictIfNeeded();
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string): Promise<number> {
    const cur = ((await this.get<number>(key)) ?? 0) + 1;
    await this.set(key, cur);
    return cur;
  }

  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const cur = ((await this.get<number>(key)) ?? 0) + 1;
    await this.set(key, cur, ttlSeconds);
    return cur;
  }

  async remember<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await loader();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k);
    }
  }
}

/**
 * Redis adapter. Kept behind a dynamic import so this package stays free of a
 * hard `ioredis` dependency — the process that opts into Redis installs it.
 */
export async function createRedisCache(url: string): Promise<CacheClient> {
  const mod: any = await import(/* @vite-ignore */ "ioredis" as any).catch(() => null);
  if (!mod) throw new Error("[@workspace/cache] ioredis is not installed");
  const IORedis = mod.default ?? mod;
  const client = new IORedis(url, { maxRetriesPerRequest: null, lazyConnect: false });

  const serialize = (v: unknown) => JSON.stringify(v);
  const deserialize = <T>(raw: string | null): T | null => {
    if (raw === null) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  };

  return {
    async get<T>(key: string) { return deserialize<T>(await client.get(key)); },
    async set<T>(key: string, value: T, ttlSeconds?: number) {
      if (ttlSeconds) await client.set(key, serialize(value), "EX", ttlSeconds);
      else await client.set(key, serialize(value));
    },
    async del(key: string) { await client.del(key); },
    async incr(key: string) { return await client.incr(key); },
    async incrWithTtl(key: string, ttlSeconds: number) {
      const n = await client.incr(key);
      if (n === 1) await client.expire(key, ttlSeconds);
      return n;
    },
    async remember<T>(key: string, ttlSeconds: number, loader: () => Promise<T>) {
      const cached = deserialize<T>(await client.get(key));
      if (cached !== null) return cached;
      const fresh = await loader();
      await client.set(key, serialize(fresh), "EX", ttlSeconds);
      return fresh;
    },
    async invalidatePrefix(prefix: string) {
      let cursor = "0";
      do {
        const [next, keys]: [string, string[]] = await client.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 500);
        cursor = next;
        if (keys.length) await client.del(keys);
      } while (cursor !== "0");
    },
  };
}

let singleton: CacheClient | null = null;

/**
 * Get (or lazily construct) the process-wide cache.
 * - If `REDIS_URL` is set → Redis adapter (fails soft to in-memory on connect error).
 * - Otherwise → in-memory LRU + TTL.
 */
export async function getCache(): Promise<CacheClient> {
  if (singleton) return singleton;
  const url = process.env["REDIS_URL"];
  if (url) {
    try {
      singleton = await createRedisCache(url);
      return singleton;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[@workspace/cache] falling back to in-memory:", (err as Error).message);
    }
  }
  singleton = new InMemoryCache();
  return singleton;
}

/** Namespaced key helper — keep every subsystem separated to avoid collisions. */
export function nsKey(namespace: string, ...parts: (string | number)[]): string {
  return [namespace, ...parts.map(String)].join(":");
}

export { InMemoryCache };
