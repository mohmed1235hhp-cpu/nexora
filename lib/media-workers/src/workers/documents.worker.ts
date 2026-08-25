import { Worker } from "bullmq";
import { randomUUID } from "crypto";
import { AIRouter } from "@workspace/media-core";
import { DocumentParseAdapter } from "@workspace/media-adapters";
import { createDb, MediaRepo } from "@workspace/media-db";
import { createRedis } from "../queues/index.js";

const repo = new MediaRepo(createDb());
const router = new AIRouter([new DocumentParseAdapter()], { profile: "balanced", perAttemptTimeoutMs: 120_000, totalBudgetMs: 240_000, maxAttempts: 1 });

new Worker(
  "media-documents",
  async (job) => {
    const { userId, jobId, input } = job.data as { userId: string; jobId: string; input: any };
    const ctx = { requestId: randomUUID(), userId, onProgress: (p: number) => job.updateProgress(Math.round(p * 100)) };
    await repo.updateJob(jobId, { status: "running", startedAt: new Date() });
    const { output, report } = await router.run(input, ctx, "document");
    await repo.updateJob(jobId, { status: output ? "completed" : "failed", output: output as any, finishedAt: new Date(), progress: 100 });
    await repo.recordHistory({ userId, jobId, kind: "document", adapterId: report.finalAdapterId ?? "none", provider: "local", latencyMs: report.totalLatencyMs, costUsd: 0, telemetry: report as any });
    return output;
  },
  { connection: createRedis() as any, concurrency: 2 },
);
console.log("[worker] documents ready");
