/**
 * Admin billing dashboard endpoints — /api/admin/payments/*.
 *
 * All routes require an authenticated admin. Aggregations run directly in
 * SQL to keep the payload small; large-scale deployments should back these
 * with materialized views instead.
 */

import { Router, type Response } from "express";
import { and, count, eq, gte, sql } from "drizzle-orm";
import {
  db,
  billingAuditLogTable,
  invoicesTable,
  paymentsTable,
  subscriptionsTable,
} from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: Router = Router();

function requireAdmin(req: AuthRequest, res: Response, next: () => void) {
  if (req.userRole !== "admin") return res.status(403).json({ error: "forbidden" });
  next();
}

router.get(
  "/admin/payments/summary",
  requireAuth,
  (req, res, next) => requireAdmin(req as AuthRequest, res, next),
  async (_req, res) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRevenueRow,
      monthRevenueRow,
      todayRevenueRow,
      activeRow,
      expiredRow,
      paymentsTodayRow,
      paymentsMonthRow,
    ] = await Promise.all([
      db
        .select({ total: sql<number>`coalesce(sum(${paymentsTable.amountMinor}), 0)` })
        .from(paymentsTable)
        .where(eq(paymentsTable.status, "succeeded")),
      db
        .select({ total: sql<number>`coalesce(sum(${paymentsTable.amountMinor}), 0)` })
        .from(paymentsTable)
        .where(and(eq(paymentsTable.status, "succeeded"), gte(paymentsTable.createdAt, startOfMonth))),
      db
        .select({ total: sql<number>`coalesce(sum(${paymentsTable.amountMinor}), 0)` })
        .from(paymentsTable)
        .where(and(eq(paymentsTable.status, "succeeded"), gte(paymentsTable.createdAt, startOfDay))),
      db.select({ n: count() }).from(subscriptionsTable).where(eq(subscriptionsTable.status, "active")),
      db.select({ n: count() }).from(subscriptionsTable).where(eq(subscriptionsTable.status, "expired")),
      db
        .select({ n: count() })
        .from(paymentsTable)
        .where(and(eq(paymentsTable.status, "succeeded"), gte(paymentsTable.createdAt, startOfDay))),
      db
        .select({ n: count() })
        .from(paymentsTable)
        .where(and(eq(paymentsTable.status, "succeeded"), gte(paymentsTable.createdAt, startOfMonth))),
    ]);

    res.json({
      revenue: {
        totalMinor: Number(totalRevenueRow[0]?.total ?? 0),
        monthMinor: Number(monthRevenueRow[0]?.total ?? 0),
        todayMinor: Number(todayRevenueRow[0]?.total ?? 0),
      },
      subscriptions: {
        active: Number(activeRow[0]?.n ?? 0),
        expired: Number(expiredRow[0]?.n ?? 0),
      },
      payments: {
        today: Number(paymentsTodayRow[0]?.n ?? 0),
        month: Number(paymentsMonthRow[0]?.n ?? 0),
      },
    });
  },
);

router.get(
  "/admin/payments/revenue-series",
  requireAuth,
  (req, res, next) => requireAdmin(req as AuthRequest, res, next),
  async (_req, res) => {
    // Last 30 days, per-day succeeded revenue.
    const rows = await db.execute(sql<{ day: string; total: number }>`
      select date_trunc('day', created_at)::date as day,
             coalesce(sum(amount_minor), 0)::int as total
      from payments
      where status = 'succeeded'
        and created_at >= now() - interval '30 days'
      group by 1
      order by 1
    `);
    res.json({ series: rows.rows ?? rows });
  },
);

router.get(
  "/admin/payments/recent",
  requireAuth,
  (req, res, next) => requireAdmin(req as AuthRequest, res, next),
  async (_req, res) => {
    const [payments, invoices, auditRows] = await Promise.all([
      db.select().from(paymentsTable).orderBy(sql`created_at desc`).limit(50),
      db.select().from(invoicesTable).orderBy(sql`created_at desc`).limit(50),
      db.select().from(billingAuditLogTable).orderBy(sql`created_at desc`).limit(50),
    ]);
    res.json({ payments, invoices, audit: auditRows });
  },
);

export default router;
