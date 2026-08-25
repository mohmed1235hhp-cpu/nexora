/**
 * Follow / Friend requests.
 *
 * The `follows`, `friend_requests` tables, the `followersCount` /
 * `followingCount` / `friendsCount` denormalized counters on `users`, and
 * the `follow` / `friend_request` / `friend_accept` notification types all
 * already existed in the schema, and GET /api/users/:username already
 * computed `isFollowing` / `isFriend` / `friendRequestStatus` — but no
 * routes ever wrote to these tables, so the frontend had nothing to call.
 * This file adds the missing write path.
 */
import { Router, Response } from "express";
import { db, followsTable, friendRequestsTable, usersTable, blocksTable, notificationsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { asyncHandler, ValidationError, NotFoundError, ForbiddenError } from "@workspace/core/errors";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { parseIdParam } from "../lib/helpers";

const router = Router();

async function assertNotBlocked(userId: number, targetId: number) {
  const blocked = await db.select().from(blocksTable).where(
    and(eq(blocksTable.blockerId, targetId), eq(blocksTable.blockedId, userId)),
  ).limit(1);
  if (blocked.length) throw new ForbiddenError("This user is not reachable");
}

async function assertTargetExists(targetId: number) {
  const target = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, targetId)).limit(1);
  if (!target.length) throw new NotFoundError("User not found");
}

// POST /api/follow/:userId
router.post("/follow/:userId", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetId = parseIdParam(req.params.userId, "userId");
  if (targetId === req.userId) throw new ValidationError("Cannot follow yourself");
  await assertTargetExists(targetId);
  await assertNotBlocked(req.userId!, targetId);

  const existing = await db.select().from(followsTable)
    .where(and(eq(followsTable.followerId, req.userId!), eq(followsTable.followingId, targetId))).limit(1);

  if (!existing.length) {
    await db.insert(followsTable).values({ followerId: req.userId!, followingId: targetId });
    await db.update(usersTable).set({ followingCount: sql`${usersTable.followingCount} + 1` }).where(eq(usersTable.id, req.userId!));
    await db.update(usersTable).set({ followersCount: sql`${usersTable.followersCount} + 1` }).where(eq(usersTable.id, targetId));
    await db.insert(notificationsTable).values({
      userId: targetId,
      actorId: req.userId!,
      type: "follow",
      resourceId: req.userId!,
      resourceType: "user",
      message: "started following you",
    });
  }

  res.json({ message: "Following", isFollowing: true });
}));

// DELETE /api/follow/:userId
router.delete("/follow/:userId", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetId = parseIdParam(req.params.userId, "userId");

  const existing = await db.select().from(followsTable)
    .where(and(eq(followsTable.followerId, req.userId!), eq(followsTable.followingId, targetId))).limit(1);

  if (existing.length) {
    await db.delete(followsTable).where(eq(followsTable.id, existing[0].id));
    await db.update(usersTable).set({ followingCount: sql`greatest(${usersTable.followingCount} - 1, 0)` }).where(eq(usersTable.id, req.userId!));
    await db.update(usersTable).set({ followersCount: sql`greatest(${usersTable.followersCount} - 1, 0)` }).where(eq(usersTable.id, targetId));
  }

  res.json({ message: "Unfollowed", isFollowing: false });
}));

// GET /api/follow/:userId/followers
router.get("/follow/:userId/followers", asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetId = parseIdParam(req.params.userId, "userId");
  const rows = await db.select({
    id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl,
  }).from(followsTable).innerJoin(usersTable, eq(usersTable.id, followsTable.followerId))
    .where(eq(followsTable.followingId, targetId));
  res.json({ followers: rows });
}));

// GET /api/follow/:userId/following
router.get("/follow/:userId/following", asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetId = parseIdParam(req.params.userId, "userId");
  const rows = await db.select({
    id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl,
  }).from(followsTable).innerJoin(usersTable, eq(usersTable.id, followsTable.followingId))
    .where(eq(followsTable.followerId, targetId));
  res.json({ following: rows });
}));

// POST /api/friend-request/:userId — send
router.post("/friend-request/:userId", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetId = parseIdParam(req.params.userId, "userId");
  if (targetId === req.userId) throw new ValidationError("Cannot friend yourself");
  await assertTargetExists(targetId);
  await assertNotBlocked(req.userId!, targetId);

  const existing = await db.select().from(friendRequestsTable).where(
    and(
      sql`(${friendRequestsTable.senderId} = ${req.userId!} AND ${friendRequestsTable.receiverId} = ${targetId})
        OR (${friendRequestsTable.senderId} = ${targetId} AND ${friendRequestsTable.receiverId} = ${req.userId!})`,
    ),
  ).limit(1);

  if (existing.length) {
    if (existing[0].status === "accepted") throw new ValidationError("Already friends");
    if (existing[0].status === "pending") throw new ValidationError("Friend request already pending");
    // rejected/cancelled — allow re-sending by reviving as pending, from this sender.
    await db.update(friendRequestsTable).set({
      status: "pending", senderId: req.userId!, receiverId: targetId,
    }).where(eq(friendRequestsTable.id, existing[0].id));
  } else {
    await db.insert(friendRequestsTable).values({ senderId: req.userId!, receiverId: targetId, status: "pending" });
  }

  await db.insert(notificationsTable).values({
    userId: targetId,
    actorId: req.userId!,
    type: "friend_request",
    resourceId: req.userId!,
    resourceType: "user",
    message: "sent you a friend request",
  });

  res.status(201).json({ message: "Friend request sent", friendRequestStatus: "pending" });
}));

// POST /api/friend-request/:userId/accept
router.post("/friend-request/:userId/accept", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const senderId = parseIdParam(req.params.userId, "userId");
  const request = await db.select().from(friendRequestsTable).where(
    and(eq(friendRequestsTable.senderId, senderId), eq(friendRequestsTable.receiverId, req.userId!), eq(friendRequestsTable.status, "pending")),
  ).limit(1);
  if (!request.length) throw new NotFoundError("No pending friend request from this user");

  await db.update(friendRequestsTable).set({ status: "accepted" }).where(eq(friendRequestsTable.id, request[0].id));
  await db.update(usersTable).set({ friendsCount: sql`${usersTable.friendsCount} + 1` }).where(eq(usersTable.id, req.userId!));
  await db.update(usersTable).set({ friendsCount: sql`${usersTable.friendsCount} + 1` }).where(eq(usersTable.id, senderId));

  await db.insert(notificationsTable).values({
    userId: senderId,
    actorId: req.userId!,
    type: "friend_accept",
    resourceId: req.userId!,
    resourceType: "user",
    message: "accepted your friend request",
  });

  res.json({ message: "Friend request accepted", friendRequestStatus: "accepted" });
}));

// POST /api/friend-request/:userId/reject
router.post("/friend-request/:userId/reject", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const senderId = parseIdParam(req.params.userId, "userId");
  const request = await db.select().from(friendRequestsTable).where(
    and(eq(friendRequestsTable.senderId, senderId), eq(friendRequestsTable.receiverId, req.userId!), eq(friendRequestsTable.status, "pending")),
  ).limit(1);
  if (!request.length) throw new NotFoundError("No pending friend request from this user");

  await db.update(friendRequestsTable).set({ status: "rejected" }).where(eq(friendRequestsTable.id, request[0].id));
  res.json({ message: "Friend request rejected", friendRequestStatus: "rejected" });
}));

// DELETE /api/friend-request/:userId — cancel a pending request you sent, or unfriend if accepted
router.delete("/friend-request/:userId", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const otherId = parseIdParam(req.params.userId, "userId");
  const request = await db.select().from(friendRequestsTable).where(
    sql`(${friendRequestsTable.senderId} = ${req.userId!} AND ${friendRequestsTable.receiverId} = ${otherId})
      OR (${friendRequestsTable.senderId} = ${otherId} AND ${friendRequestsTable.receiverId} = ${req.userId!})`,
  ).limit(1);
  if (!request.length) throw new NotFoundError("No friend relationship with this user");

  const wasAccepted = request[0].status === "accepted";
  await db.update(friendRequestsTable).set({ status: "cancelled" }).where(eq(friendRequestsTable.id, request[0].id));

  if (wasAccepted) {
    await db.update(usersTable).set({ friendsCount: sql`greatest(${usersTable.friendsCount} - 1, 0)` }).where(eq(usersTable.id, req.userId!));
    await db.update(usersTable).set({ friendsCount: sql`greatest(${usersTable.friendsCount} - 1, 0)` }).where(eq(usersTable.id, otherId));
  }

  res.json({ message: wasAccepted ? "Unfriended" : "Friend request cancelled", friendRequestStatus: null });
}));

// GET /api/friend-request/incoming — pending requests sent TO me
router.get("/friend-request/incoming", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const rows = await db.select({
    id: friendRequestsTable.id, createdAt: friendRequestsTable.createdAt,
    user: { id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl },
  }).from(friendRequestsTable).innerJoin(usersTable, eq(usersTable.id, friendRequestsTable.senderId))
    .where(and(eq(friendRequestsTable.receiverId, req.userId!), eq(friendRequestsTable.status, "pending")));
  res.json({ requests: rows });
}));

export default router;
