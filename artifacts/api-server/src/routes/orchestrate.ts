import { Router } from "express";
import { z } from "zod";
import { getPlatform } from "@workspace/platform-core";
import { deductCredits } from "../lib/credits";
import { optionalAuth, requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(optionalAuth);

const OrchestrateBody = z.object({
  input: z.string().min(1).max(64_000),
  sessionId: z.string().min(1).max(128).optional(),
});

/**
 * POST /api/ai/orchestrate — Enterprise Upgrade STEP 1: the AI Orchestrator.
 *
 * This is @workspace/platform-core's full User -> AICore -> TaskManager ->
 * AIOrchestrator -> Agents pipeline (intent detection, DAG task planning,
 * per-task retry + backup-agent fallback, conversation memory, merged
 * response) — that package existed complete but with an EMPTY agent
 * registry (nothing to actually discover for any capability). It's now
 * backed by the Phase 2 Provider Manager agents (see
 * lib/platform-core/src/agents/aiCoreAgents.ts), so intents like chat,
 * search, image.generate, image.analyze, voice, code.review, code.generate,
 * document.analyze, and research route through Claude/OpenAI/Groq/... with
 * their own automatic failover underneath.
 *
 * NOTE: app.build and website.build blueprints include steps
 * (planning.plan, architecture.design, design.ui, content.write, code.test,
 * deploy.package, deploy.deliver) that have no registered agent yet — those
 * specific steps come back as a `no_agent` TaskResult rather than crashing,
 * and the merged response reflects that as a partial result. Use the
 * existing dedicated /api/ai/app and /api/ai/website routes (or the new
 * /api/ai/jobs background-queue versions) for a complete result today.
 */
router.post("/ai/orchestrate", async (req: AuthRequest, res) => {
  const parsed = OrchestrateBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { input, sessionId } = parsed.data;

  if (req.userId) {
    try {
      await deductCredits(req.userId, "orchestrate", "المنسّق الذكي", 5, null);
    } catch {
      return res.status(402).json({ error: "انتهى رصيدك اليومي. سيتجدد الرصيد خلال 24 ساعة." });
    }
  }

  const platform = getPlatform();
  const response = await platform.ai.handle({
    requestId: `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    sessionId: sessionId ?? `anon_${req.userId ?? "guest"}_${Date.now()}`,
    userId: req.userId ? String(req.userId) : undefined,
    input,
  });

  res.json(response);
});

// GET /api/ai/orchestrate/dashboard — platform-level monitoring (agents,
// queue depth, error/retry rates) as a companion to /api/ai/dashboard
// (which covers the raw provider layer).
router.get("/ai/orchestrate/dashboard", requireAuth, requireAdmin, async (_req, res) => {
  const platform = getPlatform();
  res.json(platform.monitor.snapshot());
});

export default router;
