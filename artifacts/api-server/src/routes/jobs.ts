import { Router } from "express";
import { z } from "zod";
import { enqueueJob, getJob, cancelJob } from "../lib/jobs";
import { deductCredits } from "../lib/credits";
import { optionalAuth, type AuthRequest } from "../middlewares/auth";
import type { QueueName } from "@workspace/queue";

const router = Router();
router.use(optionalAuth);

const JOB_KINDS: Record<string, { queue: QueueName; credits: number; label: string }> = {
  website: { queue: "website-build", credits: 15, label: "إنشاء المواقع (خلفي)" },
  app: { queue: "app-build", credits: 15, label: "إنشاء التطبيقات (خلفي)" },
  video: { queue: "video", credits: 20, label: "إنشاء الفيديو (خلفي)" },
};

const CreateJobBody = z.object({
  kind: z.enum(["website", "app", "video"]),
  input: z.record(z.string(), z.unknown()),
});

/**
 * POST /api/ai/jobs — Background Job Queue (Enterprise Upgrade STEP 2).
 * Additive: the existing synchronous /ai/website, /ai/app, /ai/video routes
 * are untouched and keep their current request/response contract. This is
 * a new, separate path for clients that prefer submit-then-poll instead of
 * holding an HTTP connection open for a long generation.
 */
router.post("/ai/jobs", async (req: AuthRequest, res) => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { kind, input } = parsed.data;
  const spec = JOB_KINDS[kind];

  if (req.userId) {
    try {
      await deductCredits(req.userId, `job:${kind}`, spec.label, spec.credits, null);
    } catch {
      return res.status(402).json({ error: "انتهى رصيدك اليومي. سيتجدد الرصيد خلال 24 ساعة." });
    }
  }

  const jobId = await enqueueJob(spec.queue, input, {
    userId: req.userId ? String(req.userId) : undefined,
    estimatedMs: kind === "video" ? 90_000 : 20_000,
  });

  res.status(202).json({ jobId, status: "queued" });
});

// GET /api/ai/jobs/:id — poll status/progress/result.
router.get("/ai/jobs/:id", async (req, res) => {
  const job = await getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "المهمة غير موجودة أو انتهت صلاحيتها" });
  res.json(job);
});

// POST /api/ai/jobs/:id/cancel — best-effort cancel (see lib/jobs.ts for
// the soft-cancel limitation on jobs already running).
router.post("/ai/jobs/:id/cancel", async (req, res) => {
  const cancelled = await cancelJob(req.params.id);
  if (!cancelled) return res.status(409).json({ error: "لا يمكن إلغاء هذه المهمة (منتهية بالفعل أو غير موجودة)" });
  res.json({ cancelled: true });
});

export default router;
