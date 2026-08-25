import { Router, Response } from "express";
import { db, presenceTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { asyncHandler, ValidationError } from "@workspace/core/errors";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { parseIdParam } from "../lib/helpers";

const router = Router();

// GET /api/presence/online-count
// Counts users whose status is "online" AND who have been active within
// the last 5 minutes (avoids counting stale rows for users who closed the
// tab without ever sending an "offline" update).
router.get("/online-count", asyncHandler(async (_req: AuthRequest, res: Response) => {
  const activeSince = new Date(Date.now() - 5 * 60 * 1000);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(presenceTable)
    .where(and(eq(presenceTable.status, "online"), gte(presenceTable.updatedAt, activeSince)));

  return res.json({ count: Number(row?.count ?? 0) });
}));

// POST /api/presence
router.post("/", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!["online", "offline", "away"].includes(status)) {
    throw new ValidationError("Invalid status");
  }
  // `updatedAt` is set explicitly here rather than relying solely on the
  // schema's $onUpdate() callback — that hook is documented to not always
  // fire through onConflictDoUpdate()/upsert paths in drizzle-orm (see
  // drizzle-team/drizzle-orm#3730), and online-count's entire correctness
  // depends on this timestamp staying fresh on every heartbeat.
  const now = new Date();
  const updates: Record<string, unknown> = { status, updatedAt: now };
  if (status === "offline") updates.lastSeen = now;

  await db.insert(presenceTable).values({ userId: req.userId!, status, updatedAt: now })
    .onConflictDoUpdate({ target: presenceTable.userId, set: updates });

  return res.json({ message: "Presence updated" });
}));

// GET /api/presence/:userId
router.get("/:userId", asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = parseIdParam(req.params.userId);
  const presence = await db.select().from(presenceTable).where(eq(presenceTable.userId, userId)).limit(1);

  if (!presence.length) {
    return res.json({ userId, status: "offline", lastSeen: null });
  }

  // Apply the same 5-minute freshness window as /online-count — without
  // this, a user who closed the tab without ever sending "offline" (network
  // drop, app killed, laptop closed) stayed reported as permanently online.
  const activeSince = new Date(Date.now() - 5 * 60 * 1000);
  const isStale = presence[0].status === "online" && presence[0].updatedAt < activeSince;

  return res.json({
    userId: presence[0].userId,
    status: isStale ? "offline" : presence[0].status,
    lastSeen: presence[0].lastSeen?.toISOString() ?? null,
  });
}));

export default router;
