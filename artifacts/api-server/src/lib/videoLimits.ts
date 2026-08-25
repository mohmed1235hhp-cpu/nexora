import { db, userCreditsTable, creditsHistoryTable } from "@workspace/db";
import { eq, and, gte, count } from "drizzle-orm";

/**
 * Video-generation daily caps by plan, per the Multi-AI Provider
 * Architecture spec:
 *   Free: 1 video / 24h · Premium: 2 / 24h · Pro: 5 / 24h
 */
export const VIDEO_DAILY_LIMITS: Record<"free" | "premium" | "pro", number> = {
  free: 1,
  premium: 2,
  pro: 5,
};

export interface VideoLimitCheck {
  allowed: boolean;
  plan: "free" | "premium" | "pro";
  used: number;
  limit: number;
  resetsAt: Date;
}

/** Reuses credits_history (already logs every tool use with a timestamp) to
 *  count how many videos this user generated in the last 24h — no new table
 *  needed just to track a rolling count. */
export async function checkVideoLimit(userId: number): Promise<VideoLimitCheck> {
  const [creditsRow] = await db
    .select({ plan: userCreditsTable.plan })
    .from(userCreditsTable)
    .where(eq(userCreditsTable.userId, userId))
    .limit(1);
  const plan = creditsRow?.plan ?? "free";

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ value: used }] = await db
    .select({ value: count() })
    .from(creditsHistoryTable)
    .where(
      and(
        eq(creditsHistoryTable.userId, userId),
        eq(creditsHistoryTable.toolName, "video"),
        gte(creditsHistoryTable.createdAt, since),
      ),
    );

  const limit = VIDEO_DAILY_LIMITS[plan];
  return { allowed: used < limit, plan, used, limit, resetsAt: new Date(since.getTime() + 24 * 60 * 60 * 1000) };
}
