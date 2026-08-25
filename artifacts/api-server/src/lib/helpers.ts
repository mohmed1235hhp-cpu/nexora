import { db, usersTable, userSkillsTable, userAiToolsTable, userBadgesTable, badgesTable, presenceTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { ValidationError } from "@workspace/core/errors";

/**
 * Bug fix: `parseInt(req.params.id)` on its own silently produces NaN for
 * non-numeric input (e.g. GET /api/portfolio/abc), which was then passed
 * straight into a Drizzle `eq()` — Postgres rejects `id = NaN` and the
 * request surfaced as an unhandled 500 instead of a clean 400. This throws
 * a proper ValidationError up front instead.
 */
export function parseIdParam(raw: string | string[] | undefined, name = "id"): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ValidationError(`Invalid ${name} parameter`);
  }
  return id;
}

export async function buildUserProfile(user: typeof usersTable.$inferSelect, viewerId?: number) {
  const [skills, aiTools, badgesData] = await Promise.all([
    db.select().from(userSkillsTable).where(eq(userSkillsTable.userId, user.id)),
    db.select().from(userAiToolsTable).where(eq(userAiToolsTable.userId, user.id)),
    db.select({ badge: badgesTable, earnedAt: userBadgesTable.earnedAt })
      .from(userBadgesTable)
      .innerJoin(badgesTable, eq(userBadgesTable.badgeId, badgesTable.id))
      .where(eq(userBadgesTable.userId, user.id)),
  ]);

  const presence = await db.select().from(presenceTable).where(eq(presenceTable.userId, user.id)).limit(1);

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    bio: user.bio,
    skills: skills.map(s => s.skill),
    aiTools: aiTools.map(t => t.tool),
    specialization: user.specialization,
    country: user.country,
    language: user.language,
    website: user.website,
    github: user.github,
    linkedin: user.linkedin,
    portfolio: user.portfolio,
    level: user.level,
    reputationScore: user.reputationScore,
    isVerified: user.isVerified,
    isOfficial: user.isOfficial,
    isFeaturedCreator: user.isFeaturedCreator,
    // Official accounts intentionally never expose a follower count.
    followersCount: user.isOfficial ? null : user.followersCount,
    followingCount: user.followingCount,
    friendsCount: user.friendsCount,
    portfolioCount: user.portfolioCount,
    likesCount: user.likesCount,
    viewsCount: user.viewsCount,
    badges: badgesData.map(b => ({
      id: b.badge.id,
      name: b.badge.name,
      description: b.badge.description,
      iconUrl: b.badge.iconUrl,
      earnedAt: b.earnedAt?.toISOString() ?? null,
    })),
    isFollowing: false,
    isFriend: false,
    friendRequestStatus: null as string | null,
    isBlocked: false,
    presence: presence.length ? {
      userId: presence[0].userId,
      status: presence[0].status,
      lastSeen: presence[0].lastSeen?.toISOString() ?? null,
    } : {
      userId: user.id,
      status: "offline",
      lastSeen: null,
    },
    createdAt: user.createdAt.toISOString(),
  };
}

export function calculateLevel(score: number): number {
  if (score < 100) return 1;
  if (score < 300) return 2;
  if (score < 700) return 3;
  if (score < 1500) return 4;
  if (score < 3000) return 5;
  if (score < 6000) return 6;
  if (score < 12000) return 7;
  if (score < 25000) return 8;
  if (score < 50000) return 9;
  return 10;
}

export function getLevelName(level: number): string {
  const names = ["", "Novice", "Explorer", "Creator", "Artisan", "Expert", "Master", "Elite", "Legend", "Grand Master", "AI Pioneer"];
  return names[level] ?? "AI Pioneer";
}
