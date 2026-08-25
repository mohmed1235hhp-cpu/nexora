/**
 * Background job queues (BullMQ + Redis).
 *
 * Respects QUEUE_DRIVER:
 *  - "memory"  → returns an in-process stub (dev/CI only; jobs run inline).
 *  - "bullmq"  → real BullMQ queue backed by REDIS_URL (required in prod).
 *
 * The Redis connection is created lazily and reused across all queues to
 * avoid opening one TCP connection per queue instance.
 */
export const QUEUES = ["media", "ai", "notify", "digest"] as const;
export type QueueName = typeof QUEUES[number];

type AnyQueue = {
  add: (name: string, data: unknown, opts?: unknown) => Promise<unknown>;
  close?: () => Promise<void>;
};

let sharedConnection: unknown | undefined;
const queueCache = new Map<QueueName, AnyQueue>();

async function getConnection() {
  if (sharedConnection) return sharedConnection;
  const IORedis = (await import("ioredis")).default;
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is required when QUEUE_DRIVER=bullmq");
  sharedConnection = new IORedis(url, { maxRetriesPerRequest: null });
  return sharedConnection;
}

function makeMemoryQueue(name: QueueName): AnyQueue {
  return {
    async add(jobName, data) {
      // Dev/CI stub — logs the job so tests can assert enqueue happened.
      // eslint-disable-next-line no-console
      console.log(`[queue:memory] ${name}/${jobName}`, data);
      return { id: `mem-${Date.now()}`, name: jobName };
    },
    async close() {
      /* no-op */
    },
  };
}

export async function makeQueue(name: QueueName): Promise<AnyQueue> {
  const cached = queueCache.get(name);
  if (cached) return cached;

  const driver = process.env.QUEUE_DRIVER ?? "memory";
  if (driver !== "bullmq") {
    const q = makeMemoryQueue(name);
    queueCache.set(name, q);
    return q;
  }

  const { Queue } = /* @ts-expect-error optional runtime dep */ await import("bullmq");
  const connection = await getConnection();
  const q = new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
    },
  }) as AnyQueue;
  queueCache.set(name, q);
  return q;
}

/** Close all cached queues + shared Redis. Call from graceful-shutdown hook. */
export async function closeAllQueues() {
  await Promise.all(
    Array.from(queueCache.values()).map((q) => q.close?.() ?? Promise.resolve()),
  );
  queueCache.clear();
  const conn = sharedConnection as { quit?: () => Promise<unknown> } | undefined;
  if (conn?.quit) await conn.quit();
  sharedConnection = undefined;
}
