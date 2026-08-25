import { Router, Response } from "express";
import { db, privacySettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { asyncHandler } from "@workspace/core/errors";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /api/privacy
router.get("/", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await db.select().from(privacySettingsTable)
    .where(eq(privacySettingsTable.userId, req.userId!)).limit(1);

  if (!settings.length) {
    await db.insert(privacySettingsTable).values({ userId: req.userId! });
    return res.json({
      userId: req.userId,
      profileVisibility: "public", portfolioVisibility: "public",
      storiesVisibility: "public", showOnlineStatus: true, showLastSeen: true,
      allowFriendRequests: true, allowMessages: "friends", showFriendsList: true,
    });
  }
  const s = settings[0];
  return res.json({
    userId: s.userId,
    profileVisibility: s.profileVisibility,
    portfolioVisibility: s.portfolioVisibility,
    storiesVisibility: s.storiesVisibility,
    showOnlineStatus: s.showOnlineStatus,
    showLastSeen: s.showLastSeen,
    allowFriendRequests: s.allowFriendRequests,
    allowMessages: s.allowMessages,
    showFriendsList: s.showFriendsList,
  });
}));

// PATCH /api/privacy
router.patch("/", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const updates = req.body;
  await db.insert(privacySettingsTable).values({ userId: req.userId!, ...updates })
    .onConflictDoUpdate({ target: privacySettingsTable.userId, set: updates });
  const settings = await db.select().from(privacySettingsTable)
    .where(eq(privacySettingsTable.userId, req.userId!)).limit(1);
  return res.json(settings[0]);
}));

export default router;
