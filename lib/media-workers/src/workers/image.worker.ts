import { Worker } from "bullmq";
import { randomUUID } from "crypto";
import { AIRouter, type AdapterContext } from "@workspace/media-core";
import { GeminiImageAdapter, OpenAIImageAdapter } from "@workspace/media-adapters";
import { createDb, MediaRepo } from "@workspace/media-db";
import { createRedis } from "../queues/index.js";

const repo = new MediaRepo(createDb());
const router = new AIRouter(
  [new OpenAIImageAdapter(), new GeminiImageAdapter()],
  { profile: "quality-first", perAttemptTimeoutMs: 90_000, totalBudgetMs: 240_000, maxAttempts: 2 },
);

new Worker(
  "media-image",
  async (job) => {
    const { userId, input, jobId } = job.data as { userId: string; jobId: string; input: any };
    const ctx: AdapterContext = {
      requestId: randomUUID(),
      userId,
      onProgress: (p) => job.updateProgress(Math.round(p * 100)),
    };
    await repo.updateJob(jobId, { status: "running", startedAt: new Date() });
    const { output, report } = await router.run(input, ctx, "image");
    await repo.updateJob(jobId, {
      status: output ? "completed" : "failed",
      output: output as any,
      finishedAt: new Date(),
      progress: 100,
    });
    await repo.recordHistory({
      userId,
      jobId,
      kind: "image",
      adapterId: report.finalAdapterId ?? "none",
      provider: report.attempts.at(-1)?.provider ?? "unknown",
      latencyMs: report.totalLatencyMs,
      costUsd: 0,
      telemetry: report as any,
    });
    return output;
  },
  { connection: createRedis() as any, concurrency: 4 },
);
console.log("[worker] image ready");
