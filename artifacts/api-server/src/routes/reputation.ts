import { Router, Response } from "express";
import { db, usersTable, userBadgesTable, badgesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { asyncHandler, NotFoundError } from "@workspace/core/errors";
import { type AuthRequest } from "../middlewares/auth";
import { calculateLevel, getLevelName, parseIdParam } from "../lib/helpers";

const router = Router();

// GET /api/reputation/:userId
router.get("/:userId", asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = parseIdParam(req.params.userId);
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (!users.length) {
    throw new NotFoundError("User not found");
  }

  const user = users[0];
  const userBadges = await db.select({ badge: badgesTable, earnedAt: userBadgesTable.earnedAt })
    .from(userBadgesTable)
    .innerJoin(badgesTable, eq(userBadgesTable.badgeId, badgesTable.id))
    .where(eq(userBadgesTable.userId, userId));

  const level = calculateLevel(user.reputationScore);
  res.json({
    userId,
    score: user.reputationScore,
    level,
    levelName: getLevelName(level),
    rank: 1,
    stars: Math.min(5, Math.floor(level / 2)),
    badges: userBadges.map(b => ({
      id: b.badge.id,
      name: b.badge.name,
      description: b.badge.description,
      iconUrl: b.badge.iconUrl,
      earnedAt: b.earnedAt?.toISOString() ?? null,
    })),
    breakdown: {
      activityScore: Math.floor(user.reputationScore * 0.3),
      qualityScore: Math.floor(user.reputationScore * 0.4),
      collaborationScore: Math.floor(user.reputationScore * 0.2),
      profileScore: Math.floor(user.reputationScore * 0.1),
    },
  });
}));

// GET /api/badges
router.get("/badges/all", asyncHandler(async (req: AuthRequest, res: Response) => {
  const badges = await db.select().from(badgesTable);
  res.json(badges.map(b => ({
    id: b.id,
    name: b.name,
    description: b.description,
    iconUrl: b.iconUrl,
    earnedAt: null,
  })));
}));

export default router;
