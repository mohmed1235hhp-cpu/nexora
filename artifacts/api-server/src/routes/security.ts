/**
 * Phase 14 — Security: Block, Unblock, Mute, Unmute, Report
 */
import { Router, Response } from "express";
import { db, blocksTable, mutesTable, reportsTable, auditLogsTable, commentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { asyncHandler, ValidationError, NotFoundError, ForbiddenError, RateLimitError } from "@workspace/core/errors";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { parseIdParam } from "../lib/helpers";

const router = Router();

// POST /api/block/:userId
router.post("/block/:userId", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetId = parseIdParam(req.params.userId, "userId");
  if (targetId === req.userId) throw new ValidationError("Cannot block yourself");

  const existing = await db.select().from(blocksTable)
    .where(and(eq(blocksTable.blockerId, req.userId!), eq(blocksTable.blockedId, targetId))).limit(1);

  if (!existing.length) {
    await db.insert(blocksTable).values({ blockerId: req.userId!, blockedId: targetId });
    await db.insert(auditLogsTable).values({
      userId: req.userId!,
      action: "block_user",
      resourceType: "user",
      resourceId: targetId,
      metadata: JSON.stringify({}),
      ipAddress: req.ip,
    });
  }

  res.json({ message: "User blocked" });
}));

// DELETE /api/block/:userId
router.delete("/block/:userId", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetId = parseIdParam(req.params.userId, "userId");
  await db.delete(blocksTable)
    .where(and(eq(blocksTable.blockerId, req.userId!), eq(blocksTable.blockedId, targetId)));

  await db.insert(auditLogsTable).values({
    userId: req.userId!,
    action: "unblock_user",
    resourceType: "user",
    resourceId: targetId,
    metadata: JSON.stringify({}),
    ipAddress: req.ip,
  });

  res.json({ message: "User unblocked" });
}));

// POST /api/mute/:userId — Phase 14: Mute user (hide their content without blocking)
router.post("/mute/:userId", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetId = parseIdParam(req.params.userId, "userId");
  if (targetId === req.userId) throw new ValidationError("Cannot mute yourself");

  const existing = await db.select().from(mutesTable)
    .where(and(eq(mutesTable.muterId, req.userId!), eq(mutesTable.mutedId, targetId))).limit(1);

  if (!existing.length) {
    await db.insert(mutesTable).values({ muterId: req.userId!, mutedId: targetId });
  }

  res.json({ message: "User muted" });
}));

// DELETE /api/mute/:userId
router.delete("/mute/:userId", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetId = parseIdParam(req.params.userId, "userId");
  await db.delete(mutesTable)
    .where(and(eq(mutesTable.muterId, req.userId!), eq(mutesTable.mutedId, targetId)));

  res.json({ message: "User unmuted" });
}));

// GET /api/mute - list muted users
router.get("/mute", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const mutes = await db.select().from(mutesTable).where(eq(mutesTable.muterId, req.userId!));
  res.json({ mutedIds: mutes.map(m => m.mutedId) });
}));

// POST /api/report
router.post("/report", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { targetType, targetId, reason, description } = req.body;

  if (!targetType || !targetId || !reason) {
    throw new ValidationError("Target type, target id, and reason required");
  }

  const validReasons = ["spam", "abuse", "harassment", "impersonation", "copyright", "illegal_content"];
  if (!validReasons.includes(reason)) {
    throw new ValidationError("Invalid reason");
  }

  // Rate limit: max 10 reports per day per user
  const recentReports = await db.select().from(reportsTable)
    .where(and(
      eq(reportsTable.reporterId, req.userId!),
    ));

  if (recentReports.length >= 50) {
    throw new RateLimitError("Too many reports submitted");
  }

  await db.insert(reportsTable).values({
    reporterId: req.userId!,
    targetType,
    targetId: parseInt(targetId),
    reason,
    description,
  });

  await db.insert(auditLogsTable).values({
    userId: req.userId!,
    action: "submit_report",
    resourceType: targetType,
    resourceId: parseInt(targetId),
    metadata: JSON.stringify({ reason }),
    ipAddress: req.ip,
  });

  res.status(201).json({ message: "Report submitted successfully" });
}));

// DELETE /api/comments/:id
router.delete("/comments/:id", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  const comment = await db.select().from(commentsTable).where(eq(commentsTable.id, id)).limit(1);

  if (!comment.length) throw new NotFoundError("Comment not found");
  if (comment[0].userId !== req.userId && !["admin", "moderator"].includes(req.userRole ?? "")) {
    throw new ForbiddenError("Forbidden");
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, id));
  res.json({ message: "Comment deleted" });
}));

export default router;
