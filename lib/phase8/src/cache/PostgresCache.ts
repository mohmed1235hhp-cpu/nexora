/**
 * Phase 8 — Database-backed cache.
 *
 * Drop-in replacement for in-memory caches (e.g. @workspace/ai-core caches)
 * that persists via Postgres so the value survives restart and can be
 * shared across worker processes. TTL supported via `expires_at`.
 *
 * Interface stays sync-async parallel so callers previously using in-memory
 * `Map` can migrate progressively.
 */
import type { PgLike } from '../queue/PostgresQueue.js';

export interface KVCache<V> {
  get(key: string): Promise<V | undefined>;
  set(key: string, value: V, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(namespace?: string): Promise<void>;
}

export const CACHE_MIGRATION_SQL = (table: string): string => `
CREATE TABLE IF NOT EXISTS ${table} (
  namespace   TEXT NOT NULL,
  key         TEXT NOT NULL,
  value       JSONB NOT NULL,
  expires_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (namespace, key)
);
CREATE INDEX IF NOT EXISTS ${table}_exp_idx ON ${table} (expires_at) WHERE expires_at IS NOT NULL;
`;

export class PostgresCache<V> implements KVCache<V> {
  constructor(
    private readonly opts: { pg: PgLike; namespace: string; table?: string },
  ) {}

  private table(): string { return this.opts.table ?? 'phase8_cache'; }

  static async migrate(pg: PgLike, table = 'phase8_cache'): Promise<void> {
    await pg.query(CACHE_MIGRATION_SQL(table));
  }

  async get(key: string): Promise<V | undefined> {
    const { rows } = await this.opts.pg.query<{ value: V; expires_at: string | null }>(
      `SELECT value, expires_at FROM ${this.table()}
        WHERE namespace=$1 AND key=$2
          AND (expires_at IS NULL OR expires_at > NOW())`,
      [this.opts.namespace, key],
    );
    return rows[0]?.value;
  }

  async set(key: string, value: V, ttlMs?: number): Promise<void> {
    const exp = ttlMs ? new Date(Date.now() + ttlMs).toISOString() : null;
    await this.opts.pg.query(
      `INSERT INTO ${this.table()} (namespace, key, value, expires_at, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, NOW())
       ON CONFLICT (namespace, key)
       DO UPDATE SET value = EXCLUDED.value,
                     expires_at = EXCLUDED.expires_at,
                     updated_at = NOW()`,
      [this.opts.namespace, key, JSON.stringify(value), exp],
    );
  }

  async delete(key: string): Promise<boolean> {
    const { rows } = await this.opts.pg.query<{ deleted: number }>(
      `WITH d AS (DELETE FROM ${this.table()} WHERE namespace=$1 AND key=$2 RETURNING 1)
       SELECT COUNT(*)::int AS deleted FROM d`,
      [this.opts.namespace, key],
    );
    return (rows[0]?.deleted ?? 0) > 0;
  }

  async clear(namespace?: string): Promise<void> {
    await this.opts.pg.query(
      `DELETE FROM ${this.table()} WHERE namespace=$1`,
      [namespace ?? this.opts.namespace],
    );
  }

  /** House-keeping — call periodically. */
  async purgeExpired(): Promise<number> {
    const { rows } = await this.opts.pg.query<{ purged: number }>(
      `WITH d AS (DELETE FROM ${this.table()} WHERE expires_at IS NOT NULL AND expires_at <= NOW() RETURNING 1)
       SELECT COUNT(*)::int AS purged FROM d`,
    );
    return rows[0]?.purged ?? 0;
  }
}

/** In-memory fallback preserving the same interface. */
export class MemoryCache<V> implements KVCache<V> {
  private readonly store = new Map<string, { value: V; expiresAt?: number }>();
  async get(key: string): Promise<V | undefined> {
    const it = this.store.get(key);
    if (!it) return undefined;
    if (it.expiresAt && it.expiresAt <= Date.now()) { this.store.delete(key); return undefined; }
    return it.value;
  }
  async set(key: string, value: V, ttlMs?: number): Promise<void> {
    this.store.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : undefined });
  }
  async delete(key: string): Promise<boolean> { return this.store.delete(key); }
  async clear(): Promise<void> { this.store.clear(); }
}
