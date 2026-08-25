/**
 * Phase 11 — Smart Search
 * Supports: Users, Skills, Tags, Portfolio, Apps, Websites
 */
import { Router, Response } from "express";
import { db, usersTable, portfolioItemsTable, portfolioTagsTable, portfolioLikesTable, portfolioSavesTable, userSkillsTable, userAiToolsTable } from "@workspace/db";
import { or, ilike, eq, desc, and, inArray, isNull, type SQL } from "drizzle-orm";
import { asyncHandler } from "@workspace/core/errors";
import { optionalAuth, type AuthRequest } from "../middlewares/auth";
import { buildUserProfile } from "../lib/helpers";

const router = Router();

// GET /api/search?q=&type=all|users|portfolio|skills|tags&category=&page=1
router.get("/", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = req.query.q as string;
    const type = (req.query.type as string) || "all";
    const category = req.query.category as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    if (!q || q.trim().length === 0) {
      return res.json({ users: [], portfolio: [], skills: [], tags: [], total: 0, query: q });
    }

    const term = `%${q.trim()}%`;
    let users: Awaited<ReturnType<typeof buildUserProfile>>[] = [];
    let portfolio: unknown[] = [];
    let skills: string[] = [];
    let tags: string[] = [];

    // Search users
    if (type === "all" || type === "users") {
      const usersData = await db.select().from(usersTable)
        .where(or(
          ilike(usersTable.username, term),
          ilike(usersTable.displayName, term),
          ilike(usersTable.bio, term),
          ilike(usersTable.specialization, term),
        ))
        .orderBy(desc(usersTable.isOfficial), desc(usersTable.reputationScore))
        .limit(type === "users" ? limit : 10)
        .offset(type === "users" ? offset : 0);

      users = await Promise.all(usersData.map(u => buildUserProfile(u, req.userId)));
    }

    // Search by skills
    if (type === "all" || type === "skills") {
      const skillsData = await db.select({ userId: userSkillsTable.userId, skill: userSkillsTable.skill })
        .from(userSkillsTable)
        .where(ilike(userSkillsTable.skill, term))
        .limit(20);

      skills = [...new Set(skillsData.map(s => s.skill))].slice(0, 10);

      // If searching by skill, also get users with that skill
      if (type === "skills" && skillsData.length > 0) {
        const userIds = [...new Set(skillsData.map(s => s.userId))];
        const skillUsers = await db.select().from(usersTable)
          .where(inArray(usersTable.id, userIds))
          .orderBy(desc(usersTable.reputationScore))
          .limit(limit).offset(offset);

        users = await Promise.all(skillUsers.map(u => buildUserProfile(u, req.userId)));
      }
    }

    // Search portfolio (title, description, type)
    if (type === "all" || type === "portfolio" || type === "apps" || type === "websites") {
      let portfolioWhere = or(
        ilike(portfolioItemsTable.title, term),
        ilike(portfolioItemsTable.description, term),
      );

      // Filter by category
      const conditions: (SQL<unknown> | undefined)[] = [
        eq(portfolioItemsTable.isPublic, true),
        isNull(portfolioItemsTable.deletedAt),
        portfolioWhere,
      ];

      if (category) {
        conditions.push(eq(portfolioItemsTable.category, category));
      }

      if (type === "apps") {
        conditions.push(eq(portfolioItemsTable.type, "app"));
      } else if (type === "websites") {
        conditions.push(eq(portfolioItemsTable.type, "website"));
      }

      const portfolioData = await db.select().from(portfolioItemsTable)
        .where(and(...conditions))
        .orderBy(desc(portfolioItemsTable.likesCount))
        .limit(type === "portfolio" || type === "apps" || type === "websites" ? limit : 10)
        .offset(type === "portfolio" || type === "apps" || type === "websites" ? offset : 0);

      // Batch-fetch tags, authors, and the viewer's like/save state in a
      // handful of queries instead of 2+ round-trips per result (was N+1:
      // up to 40 extra queries for a 20-item page). isLiked/isSaved were
      // also previously hardcoded to false for every result regardless of
      // whether the viewer had actually liked/saved the item.
      const itemIds = portfolioData.map((p) => p.id);
      const userIds = [...new Set(portfolioData.map((p) => p.userId))];

      const [tagsData, authorsData, likedRows, savedRows] = await Promise.all([
        itemIds.length
          ? db.select().from(portfolioTagsTable).where(inArray(portfolioTagsTable.portfolioItemId, itemIds))
          : Promise.resolve([]),
        userIds.length
          ? db.select().from(usersTable).where(inArray(usersTable.id, userIds))
          : Promise.resolve([]),
        req.userId && itemIds.length
          ? db.select({ portfolioItemId: portfolioLikesTable.portfolioItemId }).from(portfolioLikesTable)
              .where(and(eq(portfolioLikesTable.userId, req.userId), inArray(portfolioLikesTable.portfolioItemId, itemIds)))
          : Promise.resolve([]),
        req.userId && itemIds.length
          ? db.select({ portfolioItemId: portfolioSavesTable.portfolioItemId }).from(portfolioSavesTable)
              .where(and(eq(portfolioSavesTable.userId, req.userId), inArray(portfolioSavesTable.portfolioItemId, itemIds)))
          : Promise.resolve([]),
      ]);

      const tagsByItem = new Map<number, string[]>();
      for (const t of tagsData) {
        const list = tagsByItem.get(t.portfolioItemId) ?? [];
        list.push(t.tag);
        tagsByItem.set(t.portfolioItemId, list);
      }
      const authorsById = new Map(authorsData.map((a) => [a.id, a]));
      const likedSet = new Set(likedRows.map((r) => r.portfolioItemId));
      const savedSet = new Set(savedRows.map((r) => r.portfolioItemId));

      portfolio = portfolioData.map((p) => {
        const author = authorsById.get(p.userId);
        return {
          id: p.id,
          userId: p.userId,
          title: p.title,
          description: p.description,
          type: p.type,
          mediaUrl: p.mediaUrl,
          thumbnailUrl: p.thumbnailUrl,
          url: p.url,
          viewsCount: p.viewsCount,
          likesCount: p.likesCount,
          commentsCount: p.commentsCount,
          tags: tagsByItem.get(p.id) ?? [],
          category: p.category,
          isPinned: p.isPinned,
          isPublic: p.isPublic,
          isLiked: likedSet.has(p.id),
          isSaved: savedSet.has(p.id),
          sharesCount: p.sharesCount,
          rating: p.rating,
          author: author ? {
            id: author.id,
            username: author.username,
            displayName: author.displayName,
            avatarUrl: author.avatarUrl,
            isVerified: author.isVerified,
          } : null,
          createdAt: p.createdAt.toISOString(),
        };
      });
    }

    // Search tags
    if (type === "all" || type === "tags") {
      const tagsData = await db.select({ tag: portfolioTagsTable.tag })
        .from(portfolioTagsTable)
        .where(ilike(portfolioTagsTable.tag, term))
        .limit(20);

      tags = [...new Set(tagsData.map(t => t.tag))].slice(0, 10);

      if (type === "tags" && tags.length > 0) {
        // Return portfolio items with these tags
        const tagItems = await db.select({ portfolioItemId: portfolioTagsTable.portfolioItemId })
          .from(portfolioTagsTable)
          .where(inArray(portfolioTagsTable.tag, tags));
        const itemIds = [...new Set(tagItems.map(t => t.portfolioItemId))];

        if (itemIds.length) {
          const tagPortfolio = await db.select().from(portfolioItemsTable)
            .where(and(
              eq(portfolioItemsTable.isPublic, true),
              isNull(portfolioItemsTable.deletedAt),
              inArray(portfolioItemsTable.id, itemIds),
            ))
            .orderBy(desc(portfolioItemsTable.likesCount))
            .limit(limit).offset(offset);

          portfolio = tagPortfolio.map(p => ({
            id: p.id,
            userId: p.userId,
            title: p.title,
            description: p.description,
            type: p.type,
            mediaUrl: p.mediaUrl,
            thumbnailUrl: p.thumbnailUrl,
            url: p.url,
            viewsCount: p.viewsCount,
            likesCount: p.likesCount,
            commentsCount: p.commentsCount,
            tags: [],
            category: p.category,
            isPinned: p.isPinned,
            isPublic: p.isPublic,
            isLiked: false,
            isSaved: false,
            sharesCount: p.sharesCount,
            rating: p.rating,
            author: null,
            createdAt: p.createdAt.toISOString(),
          }));
        }
      }
    }

    return res.json({
      users,
      portfolio,
      skills,
      tags,
      total: users.length + portfolio.length,
      query: q,
      page,
    });
}));

// GET /api/search/suggestions?q=
router.get("/suggestions", optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    const q = req.query.q as string;
    if (!q || q.trim().length < 1) {
      return res.json({ suggestions: [] });
    }

    const term = `%${q.trim()}%`;

    const [users, skills, tags] = await Promise.all([
      db.select({ username: usersTable.username, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl, isVerified: usersTable.isVerified })
        .from(usersTable)
        .where(or(ilike(usersTable.username, term), ilike(usersTable.displayName, term)))
        .limit(4),
      db.select({ skill: userSkillsTable.skill })
        .from(userSkillsTable)
        .where(ilike(userSkillsTable.skill, term))
        .limit(3),
      db.select({ tag: portfolioTagsTable.tag })
        .from(portfolioTagsTable)
        .where(ilike(portfolioTagsTable.tag, term))
        .limit(3),
    ]);

    const suggestions = [
      ...users.map(u => ({
        type: "user" as const,
        label: u.displayName,
        value: u.username,
        avatarUrl: u.avatarUrl,
        isVerified: u.isVerified,
      })),
      ...[...new Set(skills.map(s => s.skill))].map(skill => ({
        type: "skill" as const,
        label: skill,
        value: skill,
        avatarUrl: null,
        isVerified: false,
      })),
      ...[...new Set(tags.map(t => t.tag))].map(tag => ({
        type: "tag" as const,
        label: `#${tag}`,
        value: tag,
        avatarUrl: null,
        isVerified: false,
      })),
    ];

    return res.json({ suggestions: suggestions.slice(0, 8) });
}));

export default router;
