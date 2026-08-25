import { enqueue, process as processQueue, type QueueName } from "@workspace/queue";
import { getCache, nsKey } from "@workspace/cache";

/**
 * Background Job Queue for heavy AI operations (video, website/app
 * generation, image upscaling, long-running tasks) — per the Enterprise
 * Upgrade spec's STEP 2. Built entirely on @workspace/queue and
 * @workspace/cache, both of which already existed fully implemented in the
 * codebase (in-memory queue by default, BullMQ+Redis in production via
 * QUEUE_DRIVER=bullmq) but had zero consumers anywhere in the app until now.
 *
 * Job status/progress/result is kept in @workspace/cache (not a new DB
 * table) — job records are transient by nature (TTL'd), so this avoids an
 * unnecessary schema change per the "don't modify the DB unless absolutely
 * necessary" instruction.
 */

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface JobRecord<TResult = unknown> {
  id: string;
  kind: QueueName;
  status: JobStatus;
  progress: number; // 0-100
  userId?: string;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  estimatedMs?: number;
  result?: TResult;
  error?: string;
  cancelRequested?: boolean;
}

const JOB_TTL_SECONDS = 60 * 60 * 6; // 6h — long enough to poll, short enough not to leak memory/Redis
const jobKey = (id: string) => nsKey("job", id);

async function saveJob(job: JobRecord): Promise<void> {
  const cache = await getCache();
  await cache.set(jobKey(job.id), job, JOB_TTL_SECONDS);
}

export async function getJob(id: string): Promise<JobRecord | null> {
  const cache = await getCache();
  return cache.get<JobRecord>(jobKey(id));
}

export async function cancelJob(id: string): Promise<boolean> {
  const job = await getJob(id);
  if (!job || job.status === "completed" || job.status === "failed") return false;
  // Soft-cancel: if the job hasn't started running yet, the worker checks
  // this flag before doing any real work and skips straight to "cancelled".
  // A job already mid-flight (status "running") finishes its current
  // provider call rather than being hard-aborted — the underlying
  // generation call isn't wired to an AbortSignal from here, which is a
  // known limitation, not a silent gap: see PHASE3 report.
  job.cancelRequested = true;
  if (job.status === "queued") job.status = "cancelled";
  await saveJob(job);
  return true;
}

export interface EnqueueOptions {
  userId?: string;
  priority?: number; // lower = runs first; e.g. paid plans can pass a lower number
  estimatedMs?: number;
}

export async function enqueueJob<TInput>(
  kind: QueueName,
  input: TInput,
  opts: EnqueueOptions = {},
): Promise<string> {
  const jobId = `${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const job: JobRecord = {
    id: jobId,
    kind,
    status: "queued",
    progress: 0,
    userId: opts.userId,
    createdAt: Date.now(),
    estimatedMs: opts.estimatedMs,
  };
  await saveJob(job);
  await enqueue(kind, { jobId, input }, { priority: opts.priority });
  return jobId;
}

/**
 * Registers the worker for a queue kind. `handler` does the real work and
 * returns the result to store; progress/status transitions and error
 * capture are handled here once, uniformly, for every job kind.
 */
export function registerJobWorker<TInput, TResult>(
  kind: QueueName,
  handler: (input: TInput, onProgress: (pct: number) => void) => Promise<TResult>,
  concurrency = 2,
): void {
  processQueue<{ jobId: string; input: TInput }>(
    kind,
    async ({ payload }) => {
      const job = await getJob(payload.jobId);
      if (!job || job.cancelRequested) {
        if (job) {
          job.status = "cancelled";
          await saveJob(job);
        }
        return;
      }

      job.status = "running";
      job.startedAt = Date.now();
      await saveJob(job);

      try {
        const result = await handler(payload.input, (pct) => {
          // Best-effort progress ping — fire-and-forget so a slow cache
          // write never blocks the actual generation work.
          void getJob(payload.jobId).then((j) => {
            if (!j) return;
            j.progress = Math.max(0, Math.min(100, pct));
            return saveJob(j);
          });
        });

        const finalJob = (await getJob(payload.jobId)) ?? job;
        finalJob.status = "completed";
        finalJob.progress = 100;
        finalJob.finishedAt = Date.now();
        finalJob.result = result;
        await saveJob(finalJob);
      } catch (err) {
        const finalJob = (await getJob(payload.jobId)) ?? job;
        finalJob.status = "failed";
        finalJob.finishedAt = Date.now();
        finalJob.error = err instanceof Error ? err.message : String(err);
        await saveJob(finalJob);
        throw err; // let @workspace/queue's own retry/backoff still apply
      }
    },
    concurrency,
  );
}
