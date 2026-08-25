import { Router, type Response } from "express";
import { z } from "zod";
import { db, creditsHistoryTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { getOrCreateCredits, getResetAt, deductCredits, MAX_DAILY_CREDITS } from "../lib/credits";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

// Local zod schemas (not present in @workspace/api-zod generated output).
const UseCreditsBody = z.object({
  toolName: z.string().min(1),
  toolLabel: z.string().min(1),
  creditsUsed: z.number().int().positive(),
  prompt: z.string().optional(),
});

const GetCreditsHistoryQueryParams = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

const router = Router();

// GET /api/credits
router.get("/credits", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const credits = await getOrCreateCredits(userId);

  return res.json({
    balance: credits.balance,
    maxDaily: MAX_DAILY_CREDITS,
    used: MAX_DAILY_CREDITS - credits.balance,
    resetAt: getResetAt(credits.lastResetAt).toISOString(),
    plan: "free",
  });
});

// GET /api/credits/history
router.get("/credits/history", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const parsed = GetCreditsHistoryQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

  const [items, totalResult] = await Promise.all([
    db.query.creditsHistoryTable.findMany({
      where: eq(creditsHistoryTable.userId, userId),
      orderBy: [desc(creditsHistoryTable.createdAt)],
      limit,
      offset,
    }),
    db.select({ total: count() })
      .from(creditsHistoryTable)
      .where(eq(creditsHistoryTable.userId, userId)),
  ]);

  return res.json({
    items,
    total: totalResult[0]?.total ?? 0,
  });
});

// POST /api/credits/use
router.post("/credits/use", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const parsed = UseCreditsBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "بيانات غير صحيحة" });
  }

  const { toolName, toolLabel, creditsUsed, prompt } = parsed.data;

  try {
    const updated = await deductCredits(userId, toolName, toolLabel, creditsUsed, prompt);
    return res.json({
      balance: updated.balance,
      maxDaily: MAX_DAILY_CREDITS,
      used: MAX_DAILY_CREDITS - updated.balance,
      resetAt: getResetAt(updated.lastResetAt).toISOString(),
      plan: "free",
    });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_CREDITS") {
      return res.status(402).json({ error: "انتهى رصيدك اليومي. سيتجدد الرصيد خلال 24 ساعة." });
    }
    throw err;
  }
});

export default router;
