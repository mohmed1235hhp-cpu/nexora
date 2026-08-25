/**
 * Phase 8 — PostgreSQL-backed durable queue.
 *
 * Implements `IQueue<T>` from @workspace/deploy-platform on top of a
 * SKIP LOCKED job table. Priority ordering (higher first), delayed
 * visibility (`notBefore`), automatic retry with exponential backoff,
 * and dead-letter after `maxAttempts`.
 *
 * The `pg` module is injected — we do not import the driver, so the
 * package stays runtime-agnostic and testable with an in-memory pool.
 */
import type { IQueue } from '@workspace/deploy-platform/interfaces';
import type { QueueItem, QueueStats } from '@workspace/deploy-platform/types';

/** Minimal Postgres client contract (matches `pg.Pool.query` shape). */
export interface PgLike {
  query<R = unknown>(sql: string, params?: readonly unknown[]): Promise<{ rows: R[] }>;
}

export interface PostgresQueueOptions {
  readonly name: string;
  readonly pg: PgLike;
  readonly table?: string;
  readonly maxAttempts?: number;
  readonly backoffBaseMs?: number;
}

interface JobRow<T> {
  id: string;
  payload: T;
  priority: number;
  enqueued_at: string;
  not_before: string;
  attempts: number;
}

/** Reasonable default schema — call `PostgresQueue.migrate` once at startup. */
export const QUEUE_MIGRATION_SQL = (table: string): string => `
CREATE TABLE IF NOT EXISTS ${table} (
  id            TEXT PRIMARY KEY,
  queue_name    TEXT NOT NULL,
  payload       JSONB NOT NULL,
  priority      INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending',
  attempts      INTEGER NOT NULL DEFAULT 0,
  last_error    TEXT,
  enqueued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  not_before    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  failed_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ${table}_pick_idx
  ON ${table} (queue_name, status, priority DESC, not_before ASC)
  WHERE status = 'pending';
`;

export class PostgresQueue<T> implements IQueue<T> {
  readonly name: string;
  private readonly pg: PgLike;
  private readonly table: string;
  private readonly maxAttempts: number;
  private readonly backoffBaseMs: number;

  // Local stats mirror; PG is source of truth for counts on restart.
  private _processed = 0;
  private _failed = 0;
  private _inflight = 0;
  private _size = 0;

  constructor(opts: PostgresQueueOptions) {
    this.name = opts.name;
    this.pg = opts.pg;
    this.table = opts.table ?? 'phase8_queue_jobs';
    this.maxAttempts = opts.maxAttempts ?? 5;
    this.backoffBaseMs = opts.backoffBaseMs ?? 1000;
  }

  static async migrate(pg: PgLike, table = 'phase8_queue_jobs'): Promise<void> {
    await pg.query(QUEUE_MIGRATION_SQL(table));
  }

  // The IQueue<T> interface is sync — we expose async variants for real work
  // and keep the sync ones as best-effort local shims. Callers targeting a
  // durable queue should use the *Async methods below.

  enqueue(payload: T, opts?: { priority?: number; notBefore?: number }): QueueItem<T> {
    const item: QueueItem<T> = {
      id: cryptoRandomId(),
      payload,
      priority: opts?.priority ?? 0,
      enqueuedAt: Date.now(),
      notBefore: opts?.notBefore,
      attempts: 0,
    };
    // fire-and-forget insert; caller can use enqueueAsync for guarantees.
    void this.enqueueAsync(payload, opts);
    this._size += 1;
    return item;
  }

  async enqueueAsync(payload: T, opts?: { priority?: number; notBefore?: number }): Promise<QueueItem<T>> {
    const id = cryptoRandomId();
    const priority = opts?.priority ?? 0;
    const notBefore = opts?.notBefore ? new Date(opts.notBefore) : new Date();
    await this.pg.query(
      `INSERT INTO ${this.table}
         (id, queue_name, payload, priority, not_before)
       VALUES ($1, $2, $3::jsonb, $4, $5)`,
      [id, this.name, JSON.stringify(payload), priority, notBefore.toISOString()],
    );
    return {
      id, payload, priority,
      enqueuedAt: Date.now(),
      notBefore: notBefore.getTime(),
      attempts: 0,
    };
  }

  /** Atomically claim the next visible job. Uses SKIP LOCKED to allow parallel workers. */
  async dequeueAsync(lockMs = 30_000): Promise<QueueItem<T> | undefined> {
    const { rows } = await this.pg.query<JobRow<T>>(
      `UPDATE ${this.table} AS q
       SET status = 'inflight',
           locked_until = NOW() + ($3::int || ' milliseconds')::interval,
           attempts = attempts + 1
       WHERE q.id = (
         SELECT id FROM ${this.table}
          WHERE queue_name = $1
            AND status = 'pending'
            AND not_before <= NOW()
          ORDER BY priority DESC, not_before ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
       ) AND q.queue_name = $1
       RETURNING id, payload, priority, enqueued_at, not_before, attempts`,
      [this.name, /* unused */ null, lockMs],
    );
    const row = rows[0];
    if (!row) return undefined;
    this._inflight += 1;
    return {
      id: row.id,
      payload: row.payload,
      priority: row.priority,
      enqueuedAt: new Date(row.enqueued_at).getTime(),
      notBefore: new Date(row.not_before).getTime(),
      attempts: row.attempts,
    };
  }

  dequeue(): QueueItem<T> | undefined { return undefined; /* async only */ }
  peek(): QueueItem<T> | undefined { return undefined; }
  size(): number { return this._size; }

  stats(): QueueStats {
    return {
      name: this.name,
      size: this._size,
      inflight: this._inflight,
      processed: this._processed,
      failed: this._failed,
    };
  }

  async markCompletedAsync(id: string): Promise<void> {
    await this.pg.query(
      `UPDATE ${this.table} SET status='done', completed_at=NOW() WHERE id=$1`, [id],
    );
    this._inflight = Math.max(0, this._inflight - 1);
    this._processed += 1;
    this._size = Math.max(0, this._size - 1);
  }
  markCompleted(id: string): void { void this.markCompletedAsync(id); }

  /** Retry with exponential backoff up to `maxAttempts`, else dead-letter. */
  async markFailedAsync(id: string, error?: string): Promise<void> {
    const { rows } = await this.pg.query<{ attempts: number }>(
      `SELECT attempts FROM ${this.table} WHERE id=$1`, [id],
    );
    const attempts = rows[0]?.attempts ?? this.maxAttempts;
    this._inflight = Math.max(0, this._inflight - 1);

    if (attempts >= this.maxAttempts) {
      await this.pg.query(
        `UPDATE ${this.table}
           SET status='dead', failed_at=NOW(), last_error=$2
         WHERE id=$1`,
        [id, error ?? null],
      );
      this._failed += 1;
      this._size = Math.max(0, this._size - 1);
      return;
    }
    const delayMs = Math.min(
      this.backoffBaseMs * 2 ** attempts,
      5 * 60_000, /* cap at 5m */
    );
    await this.pg.query(
      `UPDATE ${this.table}
         SET status='pending',
             not_before = NOW() + ($2::int || ' milliseconds')::interval,
             last_error=$3
       WHERE id=$1`,
      [id, delayMs, error ?? null],
    );
  }
  markFailed(id: string): void { void this.markFailedAsync(id); }
}

function cryptoRandomId(): string {
  const g: { crypto?: Crypto } = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
