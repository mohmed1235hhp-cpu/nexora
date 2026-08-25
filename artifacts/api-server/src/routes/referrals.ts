import { Router, Response } from "express";
import crypto from "crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, referralsTable, userCreditsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { asyncHandler, ConflictError, NotFoundError } from "@workspace/core/errors";
import { validate } from "../middlewares/validate";
import { z } from "zod";

const router = Router();
function makeCode() { return crypto.randomBytes(6).toString("base64url").toUpperCase(); }

router.get("/referrals", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  let [existing] = await db.select().from(referralsTable).where(eq(referralsTable.inviterId, req.userId!)).limit(1);
  if (!existing) {
    [existing] = await db.insert(referralsTable).values({ inviterId: req.userId!, code: makeCode() }).returning();
  }
  const rows = await db.select().from(referralsTable).where(eq(referralsTable.inviterId, req.userId!)).orderBy(desc(referralsTable.createdAt));
  res.json({ code: existing.code, referrals: rows, rewards: rows.filter(r => r.status === "completed").reduce((s,r)=>s+r.inviterReward,0) });
}));

router.post("/referrals/claim", requireAuth, validate({ body: z.object({ code: z.string().min(4).max(32) }) }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const [row] = await db.select().from(referralsTable).where(eq(referralsTable.code, req.body.code.toUpperCase())).limit(1);
    if (!row) throw new NotFoundError("Referral code not found");
    if (row.inviterId === req.userId) return res.status(400).json({ error: "You cannot claim your own referral code" });
    if (row.status === "completed") return res.status(409).json({ error: "Referral already claimed" });
    await db.transaction(async (tx) => {
      // Atomically claim the referral. This prevents two concurrent requests
      // from both receiving the reward for the same referral code.
      const [claimed] = await tx.update(referralsTable)
        .set({ inviteeId: req.userId!, status: "completed", completedAt: new Date() })
        .where(and(eq(referralsTable.id, row.id), eq(referralsTable.status, "pending")))
        .returning();

      if (!claimed) {
        throw new ConflictError("Referral already claimed");
      }

      for (const [uid, amount] of [[row.inviterId, row.inviterReward], [req.userId!, row.inviteeReward]] as const) {
        await tx.insert(userCreditsTable)
          .values({ userId: uid, balance: amount })
          .onConflictDoUpdate({
            target: userCreditsTable.userId,
            set: { balance: sql`${userCreditsTable.balance} + ${amount}` },
          });
      }
    });
    res.json({ success: true, inviterReward: row.inviterReward, inviteeReward: row.inviteeReward });
  }));

export default router;
