/**
 * Phase 12 — Notifications (Real-Time via SSE)
 *
 * SSE clients are held in-memory per process (`sseClients`). That's fine for
 * a single instance, but once the API scales horizontally (see
 * UPGRADE_MILLION_USERS.md) a notification triggered on instance A never
 * reaches a client whose SSE connection landed on instance B. `sendNotification`
 * now also publishes to a Redis channel when REDIS_URL is configured, and
 * every instance subscribes and fans out to its own local sseClients —
 * mirroring the same optional-Redis, in-process-fallback pattern already used
 * in middlewares/rateLimit.ts. Without REDIS_URL (local dev, single instance)
 * this is a no-op and behavior is unchanged.
 */
import { Router, Response } from "express";
import { db, notificationsTable, usersTable } from "@workspace/db";
import { eq, and, desc, inArray, count } from "drizzle-orm";
import { asyncHandler } from "@workspace/core/errors";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { buildUserProfile, parseIdParam } from "../lib/helpers";
import { maybeSendDailyTip } from "../lib/smart-tips";

const router = Router();

// SSE clients: userId → Response[]
const sseClients = new Map<number, Response[]>();

const REDIS_CHANNEL = "nexora:notifications";

// Same lazy-client pattern as middlewares/rateLimit.ts: `null` = not
// attempted, `false` = attempted and unavailable, otherwise the live client.
let redisPub: import("ioredis").Redis | null | false = null;
let redisSub: import("ioredis").Redis | null | false = null;

async function getRedisPub() {
  if (redisPub !== null) return redisPub || null;
  if (!process.env.REDIS_URL) {
    redisPub = false;
    return null;
  }
  try {
    const { default: IORedis } = await import("ioredis");
    const client = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: false });
    client.on("error", () => {});
    redisPub = client;
    return client;
  } catch {
    redisPub = false;
    return null;
  }
}

async function initRedisSub() {
  if (redisSub !== null) return;
  if (!process.env.REDIS_URL) {
    redisSub = false;
    return;
  }
  try {
    const { default: IORedis } = await import("ioredis");
    const client = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: false });
    client.on("error", () => {});
    await client.subscribe(REDIS_CHANNEL);
    client.on("message", (_channel, raw) => {
      try {
        const { userId, notification } = JSON.parse(raw) as { userId: number; notification: object };
        deliverLocal(userId, notification);
      } catch {}
    });
    redisSub = client;
  } catch {
    redisSub = false;
  }
}
void initRedisSub();

// Writes to this process's own connected clients only — never call directly
// from route handlers; go through sendNotification so other instances hear
// about it too.
function deliverLocal(userId: number, notification: object) {
  const clients = sseClients.get(userId);
  if (clients?.length) {
    const data = `data: ${JSON.stringify(notification)}\n\n`;
    for (const client of clients) {
      try {
        client.write(data);
      } catch {}
    }
  }
}

export function sendNotification(userId: number, notification: object) {
  deliverLocal(userId, notification);
  // Fan out to any other instances' connected clients for the same user.
  // Best-effort: if Redis is down, that instance's clients simply miss the
  // push (same degrade-not-fail posture as rateLimit.ts) — they'll still see
  // it on next poll/reconnect.
  getRedisPub().then((client) => {
    client?.publish(REDIS_CHANNEL, JSON.stringify({ userId, notification })).catch(() => {});
  }).catch(() => {});
}

// GET /api/notifications/stream — SSE endpoint for real-time notifications (Phase 12)
router.get("/stream", requireAuth, (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Register client
  const clients = sseClients.get(userId) ?? [];
  clients.push(res);
  sseClients.set(userId, clients);

  // Send heartbeat every 25s
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  // Send initial unread count
  db.select({ count: count() }).from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)))
    .then(([row]) => {
      try {
        res.write(`data: ${JSON.stringify({ type: "unread_count", count: row?.count ?? 0 })}\n\n`);
      } catch {}
    }).catch(() => {});

  req.on("close", () => {
    clearInterval(heartbeat);
    const remaining = (sseClients.get(userId) ?? []).filter(c => c !== res);
    if (remaining.length) sseClients.set(userId, remaining);
    else sseClients.delete(userId);
  });
});

// GET /api/notifications
router.get("/", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 30;
  const offset = (page - 1) * limit;

  if (page === 1) {
    await maybeSendDailyTip(req.userId!);
  }

  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, req.userId!))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit).offset(offset);

  // COUNT(*) in SQL instead of fetching every unread row just to read
  // `.length` — the old version pulled full notification rows (including
  // message text) across the network for every unread notification, on
  // every page load, just to get a number.
  const [unreadRow] = await db.select({ count: count() }).from(notificationsTable)
    .where(and(eq(notificationsTable.userId, req.userId!), eq(notificationsTable.isRead, false)));

  // Batch-fetch actors in one query instead of one round-trip per
  // notification (was N+1: up to `limit` extra queries per page load).
  const actorIds = [...new Set(notifications.map((n) => n.actorId).filter((id): id is number => id != null))];
  const actors = actorIds.length
    ? await db.select().from(usersTable).where(inArray(usersTable.id, actorIds))
    : [];
  const actorProfiles = new Map(
    await Promise.all(actors.map(async (a) => [a.id, await buildUserProfile(a)] as const)),
  );

  const built = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    isRead: n.isRead,
    resourceId: n.resourceId,
    resourceType: n.resourceType,
    actor: n.actorId != null ? (actorProfiles.get(n.actorId) ?? null) : null,
    createdAt: n.createdAt.toISOString(),
  }));

  res.json({
    notifications: built,
    total: built.length,
    unreadCount: unreadRow?.count ?? 0,
    page,
  });
}));

// POST /api/notifications/read-all
router.post("/read-all", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, req.userId!));

  sendNotification(req.userId!, { type: "unread_count", count: 0 });
  res.json({ message: "All notifications marked as read" });
}));

// POST /api/notifications/:id/read
router.post("/:id/read", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.userId!)));

  res.json({ message: "Notification marked as read" });
}));

// GET /api/notifications/unread-count
router.get("/unread-count", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const [row] = await db.select({ count: count() }).from(notificationsTable)
    .where(and(eq(notificationsTable.userId, req.userId!), eq(notificationsTable.isRead, false)));

  res.json({ count: row?.count ?? 0 });
}));

export default router;
