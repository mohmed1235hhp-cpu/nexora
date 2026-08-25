import { Worker } from "bullmq";
import { randomUUID } from "crypto";
import { AIRouter } from "@workspace/media-core";
import { OpenAISTTAdapter, OpenAITTSAdapter } from "@workspace/media-adapters";
import { createDb, MediaRepo } from "@workspace/media-db";
import { createRedis } from "../queues/index.js";

const repo = new MediaRepo(createDb());
const tts = new AIRouter([new OpenAITTSAdapter()], { profile: "quality-first", perAttemptTimeoutMs: 60_000, totalBudgetMs: 120_000, maxAttempts: 2 });
const stt = new AIRouter([new OpenAISTTAdapter()], { profile: "quality-first", perAttemptTimeoutMs: 60_000, totalBudgetMs: 120_000, maxAttempts: 2 });

new Worker(
  "media-voice",
  async (job) => {
    const { userId, jobId, mode, input } = job.data as { userId: string; jobId: string; mode: "tts" | "stt"; input: any };
    const ctx = { requestId: randomUUID(), userId, onProgress: (p: number) => job.updateProgress(Math.round(p * 100)) };
    await repo.updateJob(jobId, { status: "running", startedAt: new Date() });
    const router = mode === "tts" ? tts : stt;
    const { output, report } = await router.run(input, ctx, `voice-${mode}`);
    await repo.updateJob(jobId, { status: output ? "completed" : "failed", output: output as any, finishedAt: new Date(), progress: 100 });
    await repo.recordHistory({ userId, jobId, kind: `voice-${mode}`, adapterId: report.finalAdapterId ?? "none", provider: report.attempts.at(-1)?.provider ?? "unknown", latencyMs: report.totalLatencyMs, costUsd: 0, telemetry: report as any });
    return output;
  },
  { connection: createRedis() as any, concurrency: 4 },
);
console.log("[worker] voice ready");
