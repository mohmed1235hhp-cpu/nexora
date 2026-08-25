import { Router, Response } from "express";
import { db, usersTable, userSkillsTable, userAiToolsTable, presenceTable, privacySettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { asyncHandler, NotFoundError, ValidationError } from "@workspace/core/errors";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { buildUserProfile, parseIdParam } from "../lib/helpers";

const router = Router();

// GET /api/profile
router.get("/", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!users.length) {
    throw new NotFoundError("User not found");
  }
  const profile = await buildUserProfile(users[0]);
  return res.json(profile);
}));

// PATCH /api/profile
router.patch("/", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    displayName, bio, skills, aiTools, specialization,
    country, language, website, github, linkedin, portfolio, avatarUrl, coverUrl
  } = req.body;

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!me) throw new NotFoundError("User not found");

  const updates: Partial<typeof usersTable.$inferSelect> = {};
  // Official/protected accounts (e.g. "Cyber AI Official") can't be renamed —
  // everything else about the profile can still be updated normally.
  if (displayName !== undefined && !me.isProtected) updates.displayName = displayName;
  if (bio !== undefined) updates.bio = bio;
  if (specialization !== undefined) updates.specialization = specialization;
  if (country !== undefined) updates.country = country;
  if (language !== undefined) updates.language = language;
  if (website !== undefined) updates.website = website;
  if (github !== undefined) updates.github = github;
  if (linkedin !== undefined) updates.linkedin = linkedin;
  if (portfolio !== undefined) updates.portfolio = portfolio;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  if (coverUrl !== undefined) updates.coverUrl = coverUrl;

  if (Object.keys(updates).length > 0) {
    await db.update(usersTable).set(updates).where(eq(usersTable.id, req.userId!));
  }

  if (Array.isArray(skills)) {
    await db.delete(userSkillsTable).where(eq(userSkillsTable.userId, req.userId!));
    if (skills.length > 0) {
      await db.insert(userSkillsTable).values(skills.map((skill: string) => ({ userId: req.userId!, skill })));
    }
  }

  if (Array.isArray(aiTools)) {
    await db.delete(userAiToolsTable).where(eq(userAiToolsTable.userId, req.userId!));
    if (aiTools.length > 0) {
      await db.insert(userAiToolsTable).values(aiTools.map((tool: string) => ({ userId: req.userId!, tool })));
    }
  }

  const updatedUser = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const updatedProfile = await buildUserProfile(updatedUser[0]);
  return res.json(updatedProfile);
}));

// POST /api/profile/presence
router.post("/presence", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!["online", "offline", "away"].includes(status)) {
    throw new ValidationError("Invalid status");
  }

  const updates: Record<string, unknown> = { status };
  if (status === "offline") {
    updates.lastSeen = new Date();
  }

  await db.insert(presenceTable).values({ userId: req.userId!, status })
    .onConflictDoUpdate({ target: presenceTable.userId, set: updates });

  return res.json({ message: "Presence updated" });
}));

// GET /api/profile/presence/:userId
router.get("/presence/:userId", asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = parseIdParam(req.params.userId);
  const presence = await db.select().from(presenceTable).where(eq(presenceTable.userId, userId)).limit(1);

  if (!presence.length) {
    return res.json({ userId, status: "offline", lastSeen: null });
  }

  return res.json({
    userId: presence[0].userId,
    status: presence[0].status,
    lastSeen: presence[0].lastSeen?.toISOString() ?? null,
  });
}));

// GET /api/profile/privacy
router.get("/privacy", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await db.select().from(privacySettingsTable)
    .where(eq(privacySettingsTable.userId, req.userId!)).limit(1);

  if (!settings.length) {
    await db.insert(privacySettingsTable).values({ userId: req.userId! });
    return res.json({
      userId: req.userId,
      profileVisibility: "public",
      portfolioVisibility: "public",
      storiesVisibility: "public",
      showOnlineStatus: true,
      showLastSeen: true,
      allowFriendRequests: true,
      allowMessages: "friends",
      showFriendsList: true,
    });
  }

  const s = settings[0];
  return res.json({
    userId: s.userId,
    profileVisibility: s.profileVisibility,
    portfolioVisibility: s.portfolioVisibility,
    storiesVisibility: s.storiesVisibility,
    showOnlineStatus: s.showOnlineStatus,
    showLastSeen: s.showLastSeen,
    allowFriendRequests: s.allowFriendRequests,
    allowMessages: s.allowMessages,
    showFriendsList: s.showFriendsList,
  });
}));

// PATCH /api/profile/privacy
router.patch("/privacy", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const updates = req.body;
  await db.insert(privacySettingsTable).values({ userId: req.userId!, ...updates })
    .onConflictDoUpdate({ target: privacySettingsTable.userId, set: updates });

  const settings = await db.select().from(privacySettingsTable)
    .where(eq(privacySettingsTable.userId, req.userId!)).limit(1);

  return res.json(settings[0]);
}));

export default router;
