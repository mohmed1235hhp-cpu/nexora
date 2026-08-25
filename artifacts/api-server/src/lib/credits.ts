// Credits Engine — manages daily reset and balance
import { db, userCreditsTable, creditsHistoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const MAX_DAILY_CREDITS = 100;

/** Get or create credits record, auto-resetting if 24h have passed */
export async function getOrCreateCredits(userId: number) {
  let credits = await db.query.userCreditsTable.findFirst({
    where: eq(userCreditsTable.userId, userId),
  });

  if (!credits) {
    const [created] = await db
      .insert(userCreditsTable)
      .values({ userId, balance: MAX_DAILY_CREDITS, lastResetAt: new Date() })
      .returning();
    return created;
  }

  // Daily reset: if last reset was ≥24h ago, restore to full balance
  const now = new Date();
  const msElapsed = now.getTime() - credits.lastResetAt.getTime();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  if (msElapsed >= TWENTY_FOUR_HOURS) {
    const [reset] = await db
      .update(userCreditsTable)
      .set({ balance: MAX_DAILY_CREDITS, lastResetAt: now })
      .where(eq(userCreditsTable.userId, userId))
      .returning();
    return reset;
  }

  return credits;
}

/** Calculate when credits will reset */
export function getResetAt(lastResetAt: Date): Date {
  return new Date(lastResetAt.getTime() + 24 * 60 * 60 * 1000);
}

/** Deduct credits and record history */
export async function deductCredits(
  userId: number,
  toolName: string,
  toolLabel: string,
  creditsUsed: number,
  prompt?: string | null,
) {
  const credits = await getOrCreateCredits(userId);

  if (credits.balance < creditsUsed) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  const [updated] = await db
    .update(userCreditsTable)
    .set({ balance: credits.balance - creditsUsed })
    .where(eq(userCreditsTable.userId, userId))
    .returning();

  await db.insert(creditsHistoryTable).values({
    userId,
    toolName,
    toolLabel,
    creditsUsed,
    prompt: prompt ?? null,
  });

  return updated;
}
