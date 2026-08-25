import { Router, Response } from "express";
import { db, portfolioSavesTable, portfolioItemsTable, portfolioTagsTable, portfolioLikesTable, usersTable } from "@workspace/db";
import { eq, and, desc, isNull } from "drizzle-orm";
import { asyncHandler } from "@workspace/core/errors";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { buildUserProfile } from "../lib/helpers";

const router = Router();

async function buildPortfolioItem(item: typeof portfolioItemsTable.$inferSelect, viewerId?: number) {
  const [tags, author] = await Promise.all([
    db.select().from(portfolioTagsTable).where(eq(portfolioTagsTable.portfolioItemId, item.id)),
    db.select().from(usersTable).where(eq(usersTable.id, item.userId)).limit(1),
  ]);
  let isLiked = false;
  let isSaved = true;
  if (viewerId) {
    const liked = await db.select().from(portfolioLikesTable)
      .where(and(eq(portfolioLikesTable.userId, viewerId), eq(portfolioLikesTable.portfolioItemId, item.id))).limit(1);
    isLiked = liked.length > 0;
  }
  return {
    id: item.id, userId: item.userId,
    author: author.length ? await buildUserProfile(author[0]) : null,
    title: item.title, description: item.description, type: item.type,
    url: item.url, mediaUrl: item.mediaUrl, thumbnailUrl: item.thumbnailUrl,
    tags: tags.map(t => t.tag), category: item.category,
    viewsCount: item.viewsCount, likesCount: item.likesCount, commentsCount: item.commentsCount,
    sharesCount: item.sharesCount, rating: item.rating, isPinned: item.isPinned,
    isPublic: item.isPublic, isLiked, isSaved,
    createdAt: item.createdAt.toISOString(),
  };
}

// GET /api/saved
router.get("/", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const saves = await db.select({ item: portfolioItemsTable })
    .from(portfolioSavesTable)
    .innerJoin(portfolioItemsTable, eq(portfolioSavesTable.portfolioItemId, portfolioItemsTable.id))
    // Exclude soft-deleted items — otherwise a deleted item stayed visible
    // forever in everyone who'd saved it's saved list.
    .where(and(eq(portfolioSavesTable.userId, req.userId!), isNull(portfolioItemsTable.deletedAt)))
    .orderBy(desc(portfolioSavesTable.createdAt))
    .limit(limit).offset(offset);

  const built = await Promise.all(saves.map(s => buildPortfolioItem(s.item, req.userId)));
  res.json({ items: built, total: built.length, page, limit });
}));

export default router;
