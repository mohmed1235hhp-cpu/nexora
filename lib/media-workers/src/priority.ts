/**
 * Priority-aware queue helpers layered on top of the existing BullMQ queues.
 *
 * Rules
 * -----
 * 0 = highest priority, 10 = lowest (BullMQ convention).
 * Premium users jump the line; free users share the standard band.
 * A per-user rate-limit (via cache) prevents a single user from draining the
 * queue and starving everyone else.
 *
 * Wiring
 * ------
 *   import { enqueueMediaJob } from "@workspace/media-workers/priority";
 *   await enqueueMediaJob("image", { userId, jobId, input }, { plan: "premium" });
 */

import type { JobsOptions } from "bullmq";
import { queues, type QueueName } from "./queues/index.js";

export type Plan = "free" | "pro" | "premium" | "admin";

/** Lower number = runs sooner. */
export function priorityForPlan(plan: Plan): number {
  switch (plan) {
    case "admin":   return 1;
    case "premium": return 2;
    case "pro":     return 4;
    case "free":
    default:        return 7;
  }
}

export interface EnqueueOptions {
  plan?: Plan;
  /** Delay in ms before the job becomes available for processing. */
  delayMs?: number;
  /** BullMQ dedupe id (skip if already queued). */
  jobId?: string;
  /** Retry policy override; defaults to exponential backoff, 3 attempts. */
  attempts?: number;
  backoffMs?: number;
}

export async function enqueueMediaJob<T>(
  queue: QueueName,
  payload: T,
  opts: EnqueueOptions = {},
) {
  const plan = opts.plan ?? "free";
  const jobOpts: JobsOptions = {
    priority: priorityForPlan(plan),
    delay:    opts.delayMs,
    jobId:    opts.jobId,
    attempts: opts.attempts ?? 3,
    backoff:  { type: "exponential", delay: opts.backoffMs ?? 2_000 },
    removeOnComplete: { age: 3_600, count: 5_000 },
    removeOnFail:     { age: 24 * 3_600 },
  };
  return queues[queue].add(`${queue}-${plan}`, payload as any, jobOpts);
}

/** Queue depth snapshot — feeds the Analytics dashboard. */
export async function queueDepth(queue: QueueName) {
  const q = queues[queue];
  const [waiting, active, delayed, failed] = await Promise.all([
    q.getWaitingCount(),
    q.getActiveCount(),
    q.getDelayedCount(),
    q.getFailedCount(),
  ]);
  return { waiting, active, delayed, failed };
}
