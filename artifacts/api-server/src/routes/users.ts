import { Router, Response } from "express";
import { db, usersTable, userSkillsTable, userAiToolsTable, followsTable, friendRequestsTable, blocksTable } from "@workspace/db";
import { eq, or, and, ilike, count, desc } from "drizzle-orm";
import { asyncHandler, NotFoundError } from "@workspace/core/errors";
import { requireAuth, optionalAuth, type AuthRequest } from "../middlewares/auth";
import { buildUserProfile } from "../lib/helpers";

const router = Router();

// GET /api/users
router.get("/", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const q = req.query.q as string;
  const offset = (page - 1) * limit;

  let query = db.select().from(usersTable).$dynamic();
  if (q) {
    query = query.where(or(
      ilike(usersTable.username, `%${q}%`),
      ilike(usersTable.displayName, `%${q}%`),
    ));
  }

  const users = await query.limit(limit).offset(offset).orderBy(desc(usersTable.reputationScore));
  const profiles = await Promise.all(users.map(u => buildUserProfile(u, req.userId)));

  res.json({ users: profiles, total: profiles.length, page, limit });
}));

// GET /api/users/:username
router.get("/:username", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await db.select().from(usersTable)
    .where(eq(usersTable.username, (req.params.username as string).toLowerCase())).limit(1);

  if (!users.length) {
    throw new NotFoundError("User not found");
  }

  const user = users[0];
  const profile = await buildUserProfile(user, req.userId);

  if (req.userId && req.userId !== user.id) {
    const [following, friendReq, blocked] = await Promise.all([
      db.select().from(followsTable)
        .where(and(eq(followsTable.followerId, req.userId!), eq(followsTable.followingId, user.id))).limit(1),
      db.select().from(friendRequestsTable)
        .where(or(
          and(eq(friendRequestsTable.senderId, req.userId!), eq(friendRequestsTable.receiverId, user.id)),
          and(eq(friendRequestsTable.senderId, user.id), eq(friendRequestsTable.receiverId, req.userId!))
        )).limit(1),
      db.select().from(blocksTable)
        .where(and(eq(blocksTable.blockerId, req.userId!), eq(blocksTable.blockedId, user.id))).limit(1),
    ]);
    profile.isFollowing = following.length > 0;
    profile.isFriend = friendReq.length > 0 && friendReq[0].status === "accepted";
    profile.friendRequestStatus = friendReq.length > 0 ? friendReq[0].status : null;
    profile.isBlocked = blocked.length > 0;
  }

  res.json(profile);
}));

// GET /api/users/:username/stats
router.get("/:username/stats", asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await db.select().from(usersTable)
    .where(eq(usersTable.username, (req.params.username as string).toLowerCase())).limit(1);

  if (!users.length) {
    throw new NotFoundError("User not found");
  }

  const user = users[0];
  const joinedDaysAgo = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

  res.json({
    portfolioCount: user.portfolioCount,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    friendsCount: user.friendsCount,
    totalLikes: user.likesCount,
    totalViews: user.viewsCount,
    reputationScore: user.reputationScore,
    level: user.level,
    rank: 1,
    joinedDaysAgo,
  });
}));

export default router;
