/**
 * Phase 2 (Media Pipeline) — image / voice / ocr / documents / files.
 * Mounted under /api/media-pipeline. Distinct from Phase 16 /api/media
 * (file storage, CDN URLs) which handles static uploads only.
 *
 * SECURITY FIX (this round): every route here previously trusted a
 * client-supplied `x-user-id` header with no session check at all — any
 * caller could impersonate any user (read their job history, enqueue paid
 * AI jobs billed to their account, obtain S3 upload URLs, stream another
 * user's job status). All routes now require an authenticated session and
 * derive the user strictly from `req.userId`; the in-memory-only, per-user
 * rate limiter has been replaced with the shared Redis-backed limiter used
 * by the rest of the API so it stays correct across multiple instances.
 */
import { Router, type Response } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import {
  ImageGenerateInput as imageGenerateSchema,
  TTSInput as ttsSchema,
  STTInput as sttSchema,
  OCRInput as ocrSchema,
  DocumentParseInput as documentParseSchema,
  UploadInput as uploadSchema,
} from "@workspace/media-core";
import { createDb, MediaRepo } from "@workspace/media-db";
import { queues } from "@workspace/media-workers";
import { S3StorageAdapter } from "@workspace/media-adapters";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { createRateLimiter } from "../middlewares/rateLimit";

const repo = new MediaRepo(createDb());
const s3 = new S3StorageAdapter();

// Shared Redis-backed limiter (falls back to in-memory only if Redis is
// unavailable) — consistent with apiLimiter/uploadLimiter elsewhere.
const mediaPipelineLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  keyPrefix: "media-pipeline",
  message: "Too many media requests, please try again later",
});

function getUserId(req: AuthRequest): string {
  // requireAuth guarantees req.userId is set before any handler below runs.
  return String(req.userId);
}

async function enqueue(
  queue: keyof typeof queues,
  kind: string,
  req: AuthRequest,
  res: Response,
  input: unknown,
  extra: Record<string, unknown> = {},
) {
  const userId = getUserId(req);
  const job = await repo.createJob({ userId, kind, status: "queued", input: input as Record<string, unknown> });
  await queues[queue].add(kind, { jobId: job.id, userId, input, ...extra });
  res.status(202).json({ jobId: job.id, status: "queued" });
}

const mediaPipelineRouter: Router = Router();

// Every route in this router requires an authenticated session and is
// subject to the shared rate limiter.
mediaPipelineRouter.use(requireAuth, mediaPipelineLimiter);

mediaPipelineRouter.post("/image", async (req: AuthRequest, res, next) => {
  try {
    const input = imageGenerateSchema.parse(req.body);
    await enqueue("image", "image", req, res, input);
  } catch (e) { next(e); }
});

mediaPipelineRouter.post("/voice/tts", async (req, res, next) => {
  try {
    const input = ttsSchema.parse(req.body);
    await enqueue("voice", "voice-tts", req, res, input, { mode: "tts" });
  } catch (e) { next(e); }
});

mediaPipelineRouter.post("/voice/stt", async (req: AuthRequest, res, next) => {
  try {
    const input = sttSchema.parse(req.body);
    await enqueue("voice", "voice-stt", req, res, input, { mode: "stt" });
  } catch (e) { next(e); }
});

mediaPipelineRouter.post("/ocr", async (req: AuthRequest, res, next) => {
  try {
    const input = ocrSchema.parse(req.body);
    await enqueue("ocr", "ocr", req, res, input);
  } catch (e) { next(e); }
});

mediaPipelineRouter.post("/documents", async (req: AuthRequest, res, next) => {
  try {
    const input = documentParseSchema.parse(req.body);
    await enqueue("documents", "document", req, res, input);
  } catch (e) { next(e); }
});

mediaPipelineRouter.post("/files/sign-upload", async (req: AuthRequest, res, next) => {
  try {
    // Namespace the key under the authenticated user so a signed URL can't
    // be crafted to write into another user's prefix.
    const userId = getUserId(req);
    const key = req.body.key ? `${userId}/${req.body.key}` : `uploads/${userId}/${randomUUID()}`;
    const input = uploadSchema.parse({ ...req.body, key });
    const out = await s3.execute(input, { requestId: randomUUID() });
    res.json(out);
  } catch (e) { next(e); }
});

mediaPipelineRouter.get("/jobs/:id", async (req: AuthRequest, res, next) => {
  try {
    const jobId = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!;
    const job = await repo.getJob(jobId, getUserId(req));
    if (!job) return res.status(404).json({ error: "not_found" });
    return res.json(job);
  } catch (e) { return next(e); }
});

/** SSE — live progress stream. Capped so an open tab can't hold a DB-polling
 * connection open forever (resource-exhaustion guard). */
const STREAM_MAX_MS = 10 * 60_000; // 10 minutes

mediaPipelineRouter.get("/jobs/:id/stream", async (req: AuthRequest, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const userId = getUserId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!;
  const deadline = Date.now() + STREAM_MAX_MS;
  let closed = false;
  req.on("close", () => { closed = true; });
  while (!closed && Date.now() < deadline) {
    const job = await repo.getJob(id, userId);
    if (!job) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "not_found" })}\n\n`);
      break;
    }
    res.write(`event: progress\ndata: ${JSON.stringify({ status: job.status, progress: job.progress })}\n\n`);
    if (job.status === "completed" || job.status === "failed") {
      res.write(`event: done\ndata: ${JSON.stringify(job)}\n\n`);
      break;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (!closed && Date.now() >= deadline) {
    res.write(`event: timeout\ndata: ${JSON.stringify({ error: "stream_timeout" })}\n\n`);
  }
  res.end();
});

mediaPipelineRouter.get("/history", async (req: AuthRequest, res, next) => {
  try {
    const limit = z.coerce.number().int().min(1).max(200).default(50).parse(req.query.limit);
    const rows = await repo.listHistory(getUserId(req), limit);
    res.json({ items: rows });
  } catch (e) { next(e); }
});

export default mediaPipelineRouter;
