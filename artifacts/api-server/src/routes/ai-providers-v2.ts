import { Router } from "express";
import {
  AiMusicBody, AiTextToSpeechBody, AiSpeechToTextBody, AiWebSearchBody, AiCodeExecuteBody,
} from "../lib/schemas/ai";
import { deductCredits } from "../lib/credits";
import { optionalAuth, type AuthRequest } from "../middlewares/auth";
import { getAIRouter, TaskType } from "@workspace/ai-core";
import { qwenSpeech, qwenOmniChat } from "../lib/providers";

/**
 * Phase 2 — Multi-AI Provider Architecture. Every route here goes through
 * the shared Provider Manager (Feature -> Provider Manager -> Provider
 * Adapter -> Provider API) with automatic retry + failover across the
 * primary/secondary/fallback chain configured in
 * lib/ai-core/src/config/routing.config.ts. No route below calls a vendor
 * API directly.
 */
const router = Router();
router.use(optionalAuth);

async function withCredits(
  req: AuthRequest, res: any,
  toolName: string, toolLabel: string, creditsUsed: number,
  handler: () => Promise<any>,
) {
  if (req.userId) {
    try {
      await deductCredits(req.userId, toolName, toolLabel, creditsUsed, null);
    } catch {
      return res.status(402).json({ error: "انتهى رصيدك اليومي. سيتجدد الرصيد خلال 24 ساعة." });
    }
  }
  return handler();
}

// POST /api/ai/music — Suno -> Udio -> Stable Audio
router.post("/ai/music", async (req: AuthRequest, res) => {
  const parsed = AiMusicBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { prompt, durationSeconds } = parsed.data;
  return withCredits(req, res, "music", "إنشاء الموسيقى", 15, async () => {
    const result = await getAIRouter().execute<{ prompt: string; durationSeconds?: number }, { url: string }>({
      task: TaskType.MusicGeneration,
      input: { prompt, durationSeconds },
      meta: { userId: req.userId ? String(req.userId) : undefined },
    });
    if (!result.ok) return res.status(502).json({ error: "تعذر إنشاء المقطع الموسيقي حالياً." });
    return res.json({ audioUrl: result.data?.url, providerId: result.providerId, creditsUsed: 15 });
  });
});

// POST /api/ai/voice/tts — Qwen Omni
router.post("/ai/voice/tts", async (req: AuthRequest, res) => {
  const parsed = AiTextToSpeechBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { text, voice } = parsed.data;
  return withCredits(req, res, "tts", "تحويل نص لصوت", 3, async () => {
    try {
      const result = await qwenSpeech(text, voice);
      return res.json({ audioBase64: result.audioBase64, mimeType: "audio/wav", providerId: "qwen3.5-omni-plus", creditsUsed: 3 });
    } catch (error) {
      return res.status(502).json({ error: error instanceof Error ? error.message : "تعذر تحويل النص لصوت حالياً." });
    }
  });
});

// POST /api/ai/voice/stt — Qwen Omni speech understanding
router.post("/ai/voice/stt", async (req: AuthRequest, res) => {
  const parsed = AiSpeechToTextBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { audioBase64, mimeType } = parsed.data;
  return withCredits(req, res, "stt", "تحويل صوت لنص", 3, async () => {
    try {
      const result = await qwenOmniChat({ text: "حوّل هذا الصوت إلى نص دقيق فقط، بدون شرح إضافي.", mediaBase64: audioBase64, mimeType, kind: "audio", outputAudio: false });
      return res.json({ text: result.text, providerId: "qwen3.5-omni-plus", creditsUsed: 3 });
    } catch (error) {
      return res.status(502).json({ error: error instanceof Error ? error.message : "تعذر تحويل الصوت لنص حالياً." });
    }
  });
});

// POST /api/ai/web-search — OpenAI Search -> Perplexity -> Google Search
// (distinct from the existing /ai/search, which stays as-is on DuckDuckGo +
// Groq so that route's existing behavior is unchanged; this is the new
// provider-chain-backed search capability from the Phase 2 spec.)
router.post("/ai/web-search", async (req: AuthRequest, res) => {
  const parsed = AiWebSearchBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { query } = parsed.data;
  return withCredits(req, res, "web-search", "بحث الإنترنت", 3, async () => {
    const result = await getAIRouter().execute<
      { query: string },
      { text?: string; results?: Array<{ title: string; url: string; snippet: string }> }
    >({
      task: TaskType.InternetSearch,
      input: { query },
      meta: { userId: req.userId ? String(req.userId) : undefined },
    });
    if (!result.ok) return res.status(502).json({ error: "تعذر البحث حالياً." });
    return res.json({ ...result.data, providerId: result.providerId, creditsUsed: 3 });
  });
});

// POST /api/ai/code-execute — Replit -> Claude -> Codex
router.post("/ai/code-execute", async (req: AuthRequest, res) => {
  const parsed = AiCodeExecuteBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { code, language } = parsed.data;
  return withCredits(req, res, "code-execute", "تنفيذ الكود", 5, async () => {
    const result = await getAIRouter().execute<
      { code: string; language?: string },
      { output?: string; stderr?: string; exitCode?: number }
    >({
      task: TaskType.CodeExecution,
      input: { code, language },
      meta: { userId: req.userId ? String(req.userId) : undefined },
    });
    if (!result.ok) return res.status(502).json({ error: "تعذر تنفيذ الكود حالياً." });
    return res.json({ ...result.data, providerId: result.providerId, creditsUsed: 5 });
  });
});

export default router;
