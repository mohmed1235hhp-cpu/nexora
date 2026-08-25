/**
 * Phase 19 — Admin Dashboard
 * Fixed: privilege escalation guard, removed simulated data, no duplicate routes
 */
import { Router, Response, NextFunction } from "express";
import {
  db,
  usersTable,
  portfolioItemsTable,
  reportsTable,
  auditLogsTable,
  featureFlagsTable,
} from "@workspace/db";
import { eq, desc, ilike, sql, and, gte, lt, ne } from "drizzle-orm";
import { asyncHandler, ValidationError, NotFoundError, ForbiddenError } from "@workspace/core/errors";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";
import { buildUserProfile, parseIdParam } from "../lib/helpers";

const router = Router();

// ─── Helper: require super_admin for sensitive role operations ─────────────────
function requireSuperAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (req.userRole !== "super_admin") {
    throw new ForbiddenError("Super Admin only");
  }
  next();
}

// GET /api/admin/stats — real counts from DB only
router.get("/stats", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsersR,
    totalPortfolioR,
    totalReportsR,
    pendingReportsR,
    bannedR,
    newTodayR,
    newWeekR,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(usersTable),
    db.select({ count: sql<number>`count(*)` }).from(portfolioItemsTable),
    db.select({ count: sql<number>`count(*)` }).from(reportsTable),
    db.select({ count: sql<number>`count(*)` }).from(reportsTable).where(eq(reportsTable.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.isBanned, true)),
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(gte(usersTable.createdAt, todayStart)),
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(gte(usersTable.createdAt, weekStart)),
  ]);

  res.json({
    totalUsers: Number(totalUsersR[0]?.count ?? 0),
    totalPortfolio: Number(totalPortfolioR[0]?.count ?? 0),
    totalReports: Number(totalReportsR[0]?.count ?? 0),
    pendingReports: Number(pendingReportsR[0]?.count ?? 0),
    bannedUsers: Number(bannedR[0]?.count ?? 0),
    newUsersToday: Number(newTodayR[0]?.count ?? 0),
    newUsersThisWeek: Number(newWeekR[0]?.count ?? 0),
    activeUsersToday: 0, // Requires session analytics — populated via analytics events
  });
}));

// GET /api/admin/users
router.get("/users", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const offset = (page - 1) * limit;
  const q = req.query.q as string | undefined;

  let query = db.select().from(usersTable).$dynamic();
  if (q?.trim()) {
    query = query.where(ilike(usersTable.username, `%${q.trim()}%`));
  }

  const [users, totalR] = await Promise.all([
    query.orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset),
    q?.trim()
      ? db.select({ count: sql<number>`count(*)` }).from(usersTable)
          .where(ilike(usersTable.username, `%${q.trim()}%`))
      : db.select({ count: sql<number>`count(*)` }).from(usersTable),
  ]);

  const profiles = await Promise.all(users.map(u => buildUserProfile(u)));
  res.json({ users: profiles, total: Number(totalR[0]?.count ?? 0), page, limit });
}));

// PATCH /api/admin/users/:id/role — only super_admin can elevate to admin
router.patch(
  "/users/:id/role",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseIdParam(req.params.id, "id");
    const { role } = req.body;

    const allowedRoles = ["user", "moderator", "support"];
    const superAdminOnlyRoles = ["admin", "super_admin"];

    if (![...allowedRoles, ...superAdminOnlyRoles].includes(role)) {
      throw new ValidationError("Invalid role");
    }

    // Only super_admin can promote to admin/super_admin
    if (superAdminOnlyRoles.includes(role) && req.userRole !== "super_admin") {
      throw new ForbiddenError("Only Super Admin can assign this role");
    }

    // Prevent self-demotion to avoid lockout
    if (id === req.userId) {
      throw new ValidationError("Cannot change your own role");
    }

    await db.update(usersTable).set({ role }).where(eq(usersTable.id, id));

    await db.insert(auditLogsTable).values({
      userId: req.userId!,
      action: "update_user_role",
      resourceType: "user",
      resourceId: id,
      metadata: JSON.stringify({ role }),
      ipAddress: req.ip,
    });

    res.json({ message: "Role updated" });
  }),
);

// POST /api/admin/users/:id/ban
router.post("/users/:id/ban", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  if (id === req.userId) {
    throw new ValidationError("Cannot ban yourself");
  }

  // Admins cannot ban super_admins
  const target = await db.select({ role: usersTable.role }).from(usersTable)
    .where(eq(usersTable.id, id)).limit(1);
  if (!target.length) {
    throw new NotFoundError("User not found");
  }
  if (target[0].role === "super_admin" && req.userRole !== "super_admin") {
    throw new ForbiddenError("Cannot ban a Super Admin");
  }

  await db.update(usersTable).set({ isBanned: true }).where(eq(usersTable.id, id));

  await db.insert(auditLogsTable).values({
    userId: req.userId!,
    action: "ban_user",
    resourceType: "user",
    resourceId: id,
    metadata: JSON.stringify({ reason: req.body.reason ?? "Admin action" }),
    ipAddress: req.ip,
  });

  res.json({ message: "User banned" });
}));

// POST /api/admin/users/:id/unban
router.post("/users/:id/unban", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  await db.update(usersTable).set({ isBanned: false }).where(eq(usersTable.id, id));

  await db.insert(auditLogsTable).values({
    userId: req.userId!,
    action: "unban_user",
    resourceType: "user",
    resourceId: id,
    metadata: JSON.stringify({}),
    ipAddress: req.ip,
  });

  res.json({ message: "User unbanned" });
}));

// GET /api/admin/reports
router.get("/reports", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;

  let query = db.select().from(reportsTable).$dynamic();
  if (status) {
    query = query.where(eq(reportsTable.status, status as "pending" | "reviewed" | "resolved" | "dismissed"));
  }

  const [reports, totalR] = await Promise.all([
    query.orderBy(desc(reportsTable.createdAt)).limit(limit).offset(offset),
    status
      ? db.select({ count: sql<number>`count(*)` }).from(reportsTable)
          .where(eq(reportsTable.status, status as "pending" | "reviewed" | "resolved" | "dismissed"))
      : db.select({ count: sql<number>`count(*)` }).from(reportsTable),
  ]);

  res.json({ reports, total: Number(totalR[0]?.count ?? 0), page, limit });
}));

// PATCH /api/admin/reports/:id/resolve
router.patch("/reports/:id/resolve", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  const { status, adminNote } = req.body;
  const validStatuses = ["reviewed", "resolved", "dismissed"];

  if (!validStatuses.includes(status)) {
    throw new ValidationError("Invalid status. Must be: reviewed | resolved | dismissed");
  }

  const report = await db.select({ id: reportsTable.id }).from(reportsTable)
    .where(eq(reportsTable.id, id)).limit(1);
  if (!report.length) {
    throw new NotFoundError("Report not found");
  }

  await db.update(reportsTable)
    .set({ status, adminNote: adminNote ?? null })
    .where(eq(reportsTable.id, id));

  await db.insert(auditLogsTable).values({
    userId: req.userId!,
    action: "resolve_report",
    resourceType: "report",
    resourceId: id,
    metadata: JSON.stringify({ status, adminNote }),
    ipAddress: req.ip,
  });

  res.json({ message: "Report updated" });
}));

// GET /api/admin/portfolio — admin view all portfolio items
router.get("/portfolio", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const offset = (page - 1) * limit;

  const items = await db.select().from(portfolioItemsTable)
    .orderBy(desc(portfolioItemsTable.createdAt))
    .limit(limit).offset(offset);

  res.json({ items, total: items.length, page, limit });
}));

// DELETE /api/admin/portfolio/:id — admin delete any portfolio item
router.delete("/portfolio/:id", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  await db.delete(portfolioItemsTable).where(eq(portfolioItemsTable.id, id));

  await db.insert(auditLogsTable).values({
    userId: req.userId!,
    action: "delete_portfolio",
    resourceType: "portfolio",
    resourceId: id,
    metadata: JSON.stringify({ reason: req.body.reason ?? "Admin action" }),
    ipAddress: req.ip,
  });

  res.json({ message: "Portfolio item deleted" });
}));

// GET /api/admin/audit-logs
router.get("/audit-logs", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
  const offset = (page - 1) * limit;

  const logs = await db.select().from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit).offset(offset);

  const totalR = await db.select({ count: sql<number>`count(*)` }).from(auditLogsTable);

  res.json({ logs, total: Number(totalR[0]?.count ?? 0), page, limit });
}));

// GET /api/admin/feature-flags
router.get("/feature-flags", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const flags = await db.select().from(featureFlagsTable).orderBy(featureFlagsTable.name);
  res.json(flags);
}));

// PATCH /api/admin/feature-flags/:name — only super_admin
router.patch(
  "/feature-flags/:name",
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name } = req.params;
    const { enabled, description } = req.body;

    const updates: Record<string, unknown> = {};
    if (typeof enabled === "boolean") updates.enabled = enabled;
    if (description !== undefined) updates.description = description;

    await db.insert(featureFlagsTable)
      .values({ name: name as string, enabled: enabled ?? false, description })
      .onConflictDoUpdate({ target: featureFlagsTable.name, set: updates });

    await db.insert(auditLogsTable).values({
      userId: req.userId!,
      action: "update_feature_flag",
      resourceType: "feature_flag",
      metadata: JSON.stringify({ name, enabled }),
      ipAddress: req.ip,
    });

    res.json({ message: "Feature flag updated" });
  }),
);

// PATCH /api/admin/portfolio/:id/feature — toggle Featured section inclusion
router.patch("/portfolio/:id/feature", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  const isFeatured = !!req.body.isFeatured;

  const rows = await db.update(portfolioItemsTable).set({ isFeatured }).where(eq(portfolioItemsTable.id, id)).returning();
  if (!rows.length) throw new NotFoundError("Portfolio item not found");

  await db.insert(auditLogsTable).values({
    userId: req.userId!,
    action: isFeatured ? "feature_portfolio" : "unfeature_portfolio",
    resourceType: "portfolio",
    resourceId: id,
    ipAddress: req.ip,
  });

  res.json(rows[0]);
}));

// PATCH /api/admin/users/:id/featured-creator — toggle "Featured Creator" badge
router.patch("/users/:id/featured-creator", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  const isFeaturedCreator = !!req.body.isFeaturedCreator;

  const rows = await db.update(usersTable).set({ isFeaturedCreator }).where(eq(usersTable.id, id)).returning();
  if (!rows.length) throw new NotFoundError("User not found");

  await db.insert(auditLogsTable).values({
    userId: req.userId!,
    action: isFeaturedCreator ? "mark_featured_creator" : "unmark_featured_creator",
    resourceType: "user",
    resourceId: id,
    ipAddress: req.ip,
  });

  res.json({ message: "تم التحديث" });
}));

export default router;
