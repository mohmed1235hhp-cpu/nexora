import { Router, Response } from "express";
import {
  db, portfolioItemsTable, portfolioTagsTable, portfolioLikesTable,
  portfolioSavesTable, commentsTable, usersTable
} from "@workspace/db";
import { eq, and, desc, count, ilike, or, inArray, sql, isNull } from "drizzle-orm";
import { asyncHandler, ValidationError, NotFoundError, ForbiddenError } from "@workspace/core/errors";
import { requireAuth, optionalAuth, type AuthRequest } from "../middlewares/auth";
import { buildUserProfile, parseIdParam } from "../lib/helpers";

const router = Router();

async function buildPortfolioItem(item: typeof portfolioItemsTable.$inferSelect, viewerId?: number) {
  const [tags, author] = await Promise.all([
    db.select().from(portfolioTagsTable).where(eq(portfolioTagsTable.portfolioItemId, item.id)),
    db.select().from(usersTable).where(eq(usersTable.id, item.userId)).limit(1),
  ]);

  let isLiked = false;
  let isSaved = false;

  if (viewerId) {
    const [liked, saved] = await Promise.all([
      db.select().from(portfolioLikesTable)
        .where(and(eq(portfolioLikesTable.userId, viewerId), eq(portfolioLikesTable.portfolioItemId, item.id))).limit(1),
      db.select().from(portfolioSavesTable)
        .where(and(eq(portfolioSavesTable.userId, viewerId), eq(portfolioSavesTable.portfolioItemId, item.id))).limit(1),
    ]);
    isLiked = liked.length > 0;
    isSaved = saved.length > 0;
  }

  const authorProfile = author.length ? await buildUserProfile(author[0]) : null;

  return {
    id: item.id,
    userId: item.userId,
    author: authorProfile,
    title: item.title,
    description: item.description,
    type: item.type,
    url: item.url,
    mediaUrl: item.mediaUrl,
    thumbnailUrl: item.thumbnailUrl,
    tags: tags.map(t => t.tag),
    category: item.category,
    viewsCount: item.viewsCount,
    likesCount: item.likesCount,
    commentsCount: item.commentsCount,
    sharesCount: item.sharesCount,
    rating: item.rating,
    isPinned: item.isPinned,
    isPublic: item.isPublic,
    isLiked,
    isSaved,
    createdAt: item.createdAt.toISOString(),
  };
}

// Shared visibility check for read/interact routes keyed by :id — a private
// item is only visible to its owner or an admin. Used by every route below
// that previously let anyone view/like/save/comment on a private item as
// long as they knew (or guessed) its numeric id.
async function assertPortfolioVisible(id: number, req: AuthRequest) {
  const item = await db.select().from(portfolioItemsTable)
    .where(and(eq(portfolioItemsTable.id, id), isNull(portfolioItemsTable.deletedAt))).limit(1);
  if (!item.length) {
    throw new NotFoundError("Portfolio item not found");
  }
  const isOwner = req.userId === item[0].userId;
  if (!item[0].isPublic && !isOwner && req.userRole !== "admin") {
    throw new NotFoundError("Portfolio item not found");
  }
  return item[0];
}

// GET /api/portfolio
router.get("/", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const category = req.query.category as string;
  const offset = (page - 1) * limit;

  let query = db.select().from(portfolioItemsTable)
    .where(and(eq(portfolioItemsTable.userId, req.userId!), isNull(portfolioItemsTable.deletedAt))).$dynamic();

  if (category) {
    query = query.where(and(
      eq(portfolioItemsTable.userId, req.userId!),
      eq(portfolioItemsTable.category, category),
      isNull(portfolioItemsTable.deletedAt),
    ));
  }

  const items = await query.orderBy(desc(portfolioItemsTable.isPinned), desc(portfolioItemsTable.createdAt))
    .limit(limit).offset(offset);

  const built = await Promise.all(items.map(i => buildPortfolioItem(i, req.userId)));
  res.json({ items: built, total: built.length, page, limit });
}));

// POST /api/portfolio
router.post("/", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, type, url, mediaUrl, thumbnailUrl, tags, category, isPublic = true } = req.body;

  if (!title || !type) {
    throw new ValidationError("Title and type required");
  }

  const [item] = await db.insert(portfolioItemsTable).values({
    userId: req.userId!,
    title, description, type, url, mediaUrl, thumbnailUrl, category, isPublic,
  }).returning();

  if (Array.isArray(tags) && tags.length > 0) {
    await db.insert(portfolioTagsTable).values(tags.map((tag: string) => ({ portfolioItemId: item.id, tag })));
  }

  await db.update(usersTable)
    .set({ portfolioCount: db.$count(portfolioItemsTable, eq(portfolioItemsTable.userId, req.userId!)) as unknown as number })
    .where(eq(usersTable.id, req.userId!));

  const built = await buildPortfolioItem(item, req.userId);
  res.status(201).json(built);
}));

// GET /api/portfolio/:id
router.get("/:id", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  const items = await db.select().from(portfolioItemsTable)
    .where(and(eq(portfolioItemsTable.id, id), isNull(portfolioItemsTable.deletedAt))).limit(1);

  if (!items.length) {
    throw new NotFoundError("Portfolio item not found");
  }

  // Privacy check: a private item is visible only to its owner (or an
  // admin). Previously missing entirely — any item ID, guessed or leaked,
  // returned full details regardless of isPublic.
  const isOwner = req.userId === items[0].userId;
  if (!items[0].isPublic && !isOwner && req.userRole !== "admin") {
    throw new NotFoundError("Portfolio item not found");
  }

  // Increment views atomically in SQL instead of read-then-write, which
  // silently dropped concurrent views under load (two requests reading the
  // same count both write count+1, losing one increment).
  const [updated] = await db.update(portfolioItemsTable)
    .set({ viewsCount: sql`${portfolioItemsTable.viewsCount} + 1` })
    .where(eq(portfolioItemsTable.id, id))
    .returning();

  const built = await buildPortfolioItem(updated, req.userId);
  res.json(built);
}));

// PATCH /api/portfolio/:id
router.patch("/:id", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  const item = await db.select().from(portfolioItemsTable)
    .where(and(eq(portfolioItemsTable.id, id), isNull(portfolioItemsTable.deletedAt))).limit(1);

  if (!item.length) {
    throw new NotFoundError("Not found");
  }
  if (item[0].userId !== req.userId) {
    throw new ForbiddenError("Forbidden");
  }

  const { title, description, type, url, mediaUrl, thumbnailUrl, tags, category, isPublic } = req.body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (type !== undefined) updates.type = type;
  if (url !== undefined) updates.url = url;
  if (mediaUrl !== undefined) updates.mediaUrl = mediaUrl;
  if (thumbnailUrl !== undefined) updates.thumbnailUrl = thumbnailUrl;
  if (category !== undefined) updates.category = category;
  if (isPublic !== undefined) updates.isPublic = isPublic;

  await db.update(portfolioItemsTable).set(updates).where(eq(portfolioItemsTable.id, id));

  if (Array.isArray(tags)) {
    await db.delete(portfolioTagsTable).where(eq(portfolioTagsTable.portfolioItemId, id));
    if (tags.length > 0) {
      await db.insert(portfolioTagsTable).values(tags.map((tag: string) => ({ portfolioItemId: id, tag })));
    }
  }

  const updatedItem = await db.select().from(portfolioItemsTable).where(eq(portfolioItemsTable.id, id)).limit(1);
  const built = await buildPortfolioItem(updatedItem[0], req.userId);
  res.json(built);
}));

// DELETE /api/portfolio/:id
router.delete("/:id", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  const item = await db.select().from(portfolioItemsTable)
    .where(and(eq(portfolioItemsTable.id, id), isNull(portfolioItemsTable.deletedAt))).limit(1);

  if (!item.length) {
    throw new NotFoundError("Not found");
  }
  if (item[0].userId !== req.userId && req.userRole !== "admin") {
    throw new ForbiddenError("Forbidden");
  }

  // Soft delete instead of a hard cascade delete — the row (and its
  // likes/comments/tags via FK) previously vanished irrecoverably the
  // instant a user tapped delete, with no undo and no moderation trail.
  // deletedAt already existed at the DB level (migration 0004) but was
  // never wired into the app; every read path now filters it out.
  await db.update(portfolioItemsTable).set({ deletedAt: new Date() }).where(eq(portfolioItemsTable.id, id));
  res.json({ message: "Deleted successfully" });
}));

// PATCH /api/portfolio/:id/pin
router.patch("/:id/pin", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  const item = await db.select().from(portfolioItemsTable)
    .where(and(eq(portfolioItemsTable.id, id), isNull(portfolioItemsTable.deletedAt))).limit(1);

  if (!item.length || item[0].userId !== req.userId) {
    throw new NotFoundError("Not found");
  }

  await db.update(portfolioItemsTable).set({ isPinned: !item[0].isPinned }).where(eq(portfolioItemsTable.id, id));
  res.json({ message: item[0].isPinned ? "Unpinned" : "Pinned" });
}));

// POST /api/portfolio/:id/like
router.post("/:id/like", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  await assertPortfolioVisible(id, req);

  const existing = await db.select().from(portfolioLikesTable)
    .where(and(eq(portfolioLikesTable.userId, req.userId!), eq(portfolioLikesTable.portfolioItemId, id))).limit(1);

  if (existing.length) {
    await db.delete(portfolioLikesTable)
      .where(and(eq(portfolioLikesTable.userId, req.userId!), eq(portfolioLikesTable.portfolioItemId, id)));
    // Atomic SQL decrement (was read-count-then-write, which drops updates
    // under concurrent likes/unlikes — two overlapping requests both read
    // the same starting count and the later write silently clobbers the
    // earlier one). GREATEST(...,0) keeps it from going negative if counts
    // ever drifted before this fix.
    const [updated] = await db.update(portfolioItemsTable)
      .set({ likesCount: sql`GREATEST(${portfolioItemsTable.likesCount} - 1, 0)` })
      .where(eq(portfolioItemsTable.id, id))
      .returning({ likesCount: portfolioItemsTable.likesCount });
    return res.json({ liked: false, likesCount: updated.likesCount });
  } else {
    // onConflictDoNothing relies on the new unique index from migration
    // 0009 (see /lib/db/migrations) — without it, two rapid double-taps
    // could both pass the SELECT-then-INSERT race above and insert two
    // like rows for the same user+item, permanently double-counting.
    const [inserted] = await db.insert(portfolioLikesTable)
      .values({ userId: req.userId!, portfolioItemId: id })
      .onConflictDoNothing({ target: [portfolioLikesTable.userId, portfolioLikesTable.portfolioItemId] })
      .returning();

    if (!inserted) {
      // Lost the race to a concurrent request that already inserted — treat
      // as already-liked rather than double-incrementing the counter.
      const [current] = await db.select({ likesCount: portfolioItemsTable.likesCount })
        .from(portfolioItemsTable).where(eq(portfolioItemsTable.id, id)).limit(1);
      return res.json({ liked: true, likesCount: current?.likesCount ?? 0 });
    }

    const [updated] = await db.update(portfolioItemsTable)
      .set({ likesCount: sql`${portfolioItemsTable.likesCount} + 1` })
      .where(eq(portfolioItemsTable.id, id))
      .returning({ likesCount: portfolioItemsTable.likesCount });
    return res.json({ liked: true, likesCount: updated.likesCount });
  }
}));

// POST /api/portfolio/:id/save
router.post("/:id/save", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  await assertPortfolioVisible(id, req);

  const existing = await db.select().from(portfolioSavesTable)
    .where(and(eq(portfolioSavesTable.userId, req.userId!), eq(portfolioSavesTable.portfolioItemId, id))).limit(1);

  if (existing.length) {
    await db.delete(portfolioSavesTable)
      .where(and(eq(portfolioSavesTable.userId, req.userId!), eq(portfolioSavesTable.portfolioItemId, id)));
    return res.json({ message: "Unsaved" });
  } else {
    // Same double-tap protection as /like, backed by the new unique index.
    await db.insert(portfolioSavesTable)
      .values({ userId: req.userId!, portfolioItemId: id })
      .onConflictDoNothing({ target: [portfolioSavesTable.userId, portfolioSavesTable.portfolioItemId] });
    return res.json({ message: "Saved" });
  }
}));

// GET /api/portfolio/:id/comments
router.get("/:id/comments", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  await assertPortfolioVisible(id, req);
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const comments = await db.select().from(commentsTable)
    .where(eq(commentsTable.portfolioItemId, id))
    .orderBy(desc(commentsTable.createdAt))
    .limit(limit).offset(offset);

  // Batch-fetch all comment authors in one query instead of one round-trip
  // per comment (was N+1: up to `limit` extra queries per page load).
  const authorIds = [...new Set(comments.map((c) => c.userId))];
  const authors = authorIds.length
    ? await db.select().from(usersTable).where(inArray(usersTable.id, authorIds))
    : [];
  const authorProfiles = new Map(
    await Promise.all(authors.map(async (a) => [a.id, await buildUserProfile(a)] as const)),
  );

  const built = comments.map((c) => ({
    id: c.id,
    userId: c.userId,
    portfolioItemId: c.portfolioItemId,
    parentId: c.parentId,
    author: authorProfiles.get(c.userId) ?? null,
    content: c.content,
    likesCount: c.likesCount,
    replies: [],
    createdAt: c.createdAt.toISOString(),
  }));

  res.json({ comments: built, total: built.length });
}));

// POST /api/portfolio/:id/comments
router.post("/:id/comments", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  await assertPortfolioVisible(id, req);
  const { content, parentId } = req.body;

  if (!content) {
    throw new ValidationError("Content required");
  }

  const [comment] = await db.insert(commentsTable).values({
    userId: req.userId!,
    portfolioItemId: id,
    content,
    parentId: parentId ?? null,
  }).returning();

  // Atomic increment instead of a recount-then-overwrite — under concurrent
  // comments the previous version could lose increments the same way the
  // like counter did above.
  await db.update(portfolioItemsTable)
    .set({ commentsCount: sql`${portfolioItemsTable.commentsCount} + 1` })
    .where(eq(portfolioItemsTable.id, id));

  const author = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);

  res.status(201).json({
    id: comment.id,
    userId: comment.userId,
    portfolioItemId: comment.portfolioItemId,
    parentId: comment.parentId,
    author: author.length ? await buildUserProfile(author[0]) : null,
    content: comment.content,
    likesCount: 0,
    replies: [],
    createdAt: comment.createdAt.toISOString(),
  });
}));

// GET /api/users/:username/portfolio
router.get("/users/:username", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await db.select().from(usersTable)
    .where(eq(usersTable.username, (req.params.username as string).toLowerCase())).limit(1);

  if (!users.length) {
    throw new NotFoundError("User not found");
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const category = req.query.category as string;
  const offset = (page - 1) * limit;

  let query = db.select().from(portfolioItemsTable)
    .where(and(eq(portfolioItemsTable.userId, users[0].id), isNull(portfolioItemsTable.deletedAt))).$dynamic();

  if (category) {
    query = query.where(and(
      eq(portfolioItemsTable.userId, users[0].id),
      eq(portfolioItemsTable.category, category),
      isNull(portfolioItemsTable.deletedAt),
    ));
  }

  const items = await query
    .orderBy(desc(portfolioItemsTable.isPinned), desc(portfolioItemsTable.createdAt))
    .limit(limit).offset(offset);

  const built = await Promise.all(items.filter(i => i.isPublic || req.userId === users[0].id)
    .map(i => buildPortfolioItem(i, req.userId)));

  res.json({ items: built, total: built.length, page, limit });
}));

export default router;
