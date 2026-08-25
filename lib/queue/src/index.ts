/**
 * @workspace/queue — unified queue abstraction.
 *
 * Purpose: run heavy work (image gen, video gen, app builds, website builds,
 * notifications, contest scoring, email) in background workers, decoupled
 * from the HTTP request path.
 *
 * Design: driver-based. Default driver is an in-process memory queue so
 * everything works with zero infra during development. In production set
 * `QUEUE_DRIVER=bullmq` + `REDIS_URL` and the same interface goes through
 * BullMQ. Additional drivers (SQS, Cloud Tasks, NATS) plug in by
 * implementing `QueueDriver`.
 *
 * Additive only — does not replace `lib/media-workers`; that package's
 * BullMQ usage is preserved. This module is the shared façade so new
 * heavy features (notifications, contests, email) don't each grow their
 * own queue plumbing.
 */

export type QueueName =
  | "image"
  | "video"
  | "app-build"
  | "website-build"
  | "notifications"
  | "email"
  | "contest"
  | "analytics"
  | "generic";

export interface JobOptions {
  /** Higher plan = lower number = runs first. Default 5. */
  priority?: number;
  /** Retry attempts on failure. Default 5. */
  attempts?: number;
  /** Base backoff in ms (exponential + jitter). Default 1000. */
  backoffMs?: number;
  /** Delay before first execution. */
  delayMs?: number;
  /** Idempotency key — same key inside dedupe window is a no-op. */
  idempotencyKey?: string;
  /** Job TTL — auto-remove after this many ms if not started. */
  ttlMs?: number;
}

export interface Job<T = unknown> {
  id: string;
  queue: QueueName;
  payload: T;
  attempt: number;
  enqueuedAt: number;
}

export type JobHandler<T = unknown> = (job: Job<T>) => Promise<void>;

export interface QueueDriver {
  enqueue<T>(queue: QueueName, payload: T, opts?: JobOptions): Promise<string>;
  process<T>(queue: QueueName, handler: JobHandler<T>, concurrency?: number): Promise<void>;
  depth(queue: QueueName): Promise<number>;
  close(): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* In-memory driver — always available, safe default for tests/dev.    */
/* ------------------------------------------------------------------ */

interface MemJob {
  id: string;
  queue: QueueName;
  payload: unknown;
  opts: JobOptions;
  attempt: number;
  runAt: number;
  enqueuedAt: number;
}

class MemoryDriver implements QueueDriver {
  private q = new Map<QueueName, MemJob[]>();
  private handlers = new Map<QueueName, { fn: JobHandler; concurrency: number; running: number }>();
  private seenKeys = new Map<string, number>();
  private timer: ReturnType<typeof setInterval> | null = null;

  private ensure(queue: QueueName): MemJob[] {
    let arr = this.q.get(queue);
    if (!arr) { arr = []; this.q.set(queue, arr); }
    return arr;
  }

  async enqueue<T>(queue: QueueName, payload: T, opts: JobOptions = {}): Promise<string> {
    if (opts.idempotencyKey) {
      const now = Date.now();
      for (const [k, exp] of this.seenKeys) if (exp < now) this.seenKeys.delete(k);
      if (this.seenKeys.has(opts.idempotencyKey)) return "dedup:" + opts.idempotencyKey;
      this.seenKeys.set(opts.idempotencyKey, Date.now() + 10 * 60_000);
    }
    const id = `${queue}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
    const job: MemJob = {
      id, queue, payload, opts,
      attempt: 0,
      runAt: Date.now() + (opts.delayMs ?? 0),
      enqueuedAt: Date.now(),
    };
    // priority: lower first
    const arr = this.ensure(queue);
    arr.push(job);
    arr.sort((a, b) => (a.opts.priority ?? 5) - (b.opts.priority ?? 5) || a.runAt - b.runAt);
    this.tick();
    return id;
  }

  async process<T>(queue: QueueName, handler: JobHandler<T>, concurrency = 4): Promise<void> {
    this.handlers.set(queue, { fn: handler as JobHandler, concurrency, running: 0 });
    this.tick();
  }

  async depth(queue: QueueName): Promise<number> {
    return this.ensure(queue).length;
  }

  private tick(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.drain(), 25);
    // don't hold the event loop
    (this.timer as unknown as { unref?: () => void }).unref?.();
  }

  private async drain(): Promise<void> {
    const now = Date.now();
    for (const [queue, arr] of this.q) {
      const h = this.handlers.get(queue);
      if (!h) continue;
      while (h.running < h.concurrency && arr.length && arr[0]!.runAt <= now) {
        const job = arr.shift()!;
        h.running++;
        this.run(job, h).finally(() => { h.running--; });
      }
    }
  }

  private async run(job: MemJob, h: { fn: JobHandler; concurrency: number; running: number }): Promise<void> {
    job.attempt++;
    try {
      await h.fn({
        id: job.id,
        queue: job.queue,
        payload: job.payload,
        attempt: job.attempt,
        enqueuedAt: job.enqueuedAt,
      });
    } catch (err) {
      const max = job.opts.attempts ?? 5;
      if (job.attempt < max) {
        const base = job.opts.backoffMs ?? 1000;
        const backoff = base * Math.pow(2, job.attempt - 1);
        const jitter = Math.random() * backoff * 0.3;
        job.runAt = Date.now() + backoff + jitter;
        this.ensure(job.queue).push(job);
      } else {
        // Dead-letter — log to stderr; observers should replace this.
        // eslint-disable-next-line no-console
        console.error(`[queue] job ${job.id} exhausted retries:`, err);
      }
    }
  }

  async close(): Promise<void> {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.q.clear();
    this.handlers.clear();
  }
}

/* ------------------------------------------------------------------ */
/* BullMQ driver — lazily loaded so the dep isn't required in dev.     */
/* ------------------------------------------------------------------ */

class BullMqDriver implements QueueDriver {
  private queues = new Map<QueueName, unknown>();
  private workers: unknown[] = [];
  private mod: any = null;
  private connection: unknown = null;

  private async lib(): Promise<any> {
    if (this.mod) return this.mod;
    // Dynamic import — only loaded when driver is selected.
    // @ts-ignore optional dep
    const bullmq = await import("bullmq");
    // @ts-ignore optional dep
    const IORedis = (await import("ioredis")).default;
    this.connection = new IORedis(globalThis.process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    this.mod = bullmq;
    return bullmq;
  }

  private async q(queue: QueueName): Promise<any> {
    if (this.queues.has(queue)) return this.queues.get(queue);
    const { Queue } = await this.lib();
    const q = new Queue(queue, { connection: this.connection });
    this.queues.set(queue, q);
    return q;
  }

  async enqueue<T>(queue: QueueName, payload: T, opts: JobOptions = {}): Promise<string> {
    const q = await this.q(queue);
    const job = await q.add(queue, payload, {
      priority: opts.priority ?? 5,
      attempts: opts.attempts ?? 5,
      backoff: { type: "exponential", delay: opts.backoffMs ?? 1000 },
      delay: opts.delayMs,
      jobId: opts.idempotencyKey,
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
    return String(job.id);
  }

  async process<T>(queue: QueueName, handler: JobHandler<T>, concurrency = 4): Promise<void> {
    const { Worker } = await this.lib();
    const w = new Worker(queue, async (job: any) => {
      await handler({
        id: String(job.id),
        queue,
        payload: job.data,
        attempt: job.attemptsMade + 1,
        enqueuedAt: job.timestamp,
      });
    }, { connection: this.connection, concurrency });
    this.workers.push(w);
  }

  async depth(queue: QueueName): Promise<number> {
    const q = await this.q(queue);
    return q.getWaitingCount();
  }

  async close(): Promise<void> {
    for (const w of this.workers) await (w as any).close?.();
    for (const q of this.queues.values()) await (q as any).close?.();
    await (this.connection as any)?.quit?.();
  }
}

/* ------------------------------------------------------------------ */
/* Singleton selector.                                                 */
/* ------------------------------------------------------------------ */

let _driver: QueueDriver | null = null;

export function getQueue(): QueueDriver {
  if (_driver) return _driver;
  const which = (globalThis.process.env.QUEUE_DRIVER ?? "memory").toLowerCase();
  _driver = which === "bullmq" ? new BullMqDriver() : new MemoryDriver();
  return _driver;
}

/** Test/override helper. */
export function setQueue(driver: QueueDriver): void { _driver = driver; }

/** Convenience wrapper — enqueue with a job. */
export async function enqueue<T>(queue: QueueName, payload: T, opts?: JobOptions): Promise<string> {
  return getQueue().enqueue(queue, payload, opts);
}

/** Convenience wrapper — register a worker. */
export async function process<T>(queue: QueueName, handler: JobHandler<T>, concurrency?: number): Promise<void> {
  return getQueue().process(queue, handler, concurrency);
}
