/**
 * User-facing billing endpoints.
 *
 *   GET  /api/payments/plans           — list plan catalog (public)
 *   GET  /api/payments/providers       — list configured providers (public)
 *   GET  /api/payments/subscription    — current user's subscription
 *   POST /api/payments/checkout        — start checkout with a provider
 *   POST /api/payments/subscription/cancel
 *   GET  /api/payments/invoices        — user's invoices
 *   GET  /api/payments/invoices/:id/pdf— download invoice PDF
 *   GET  /api/payments/history         — payment history
 *
 * Idempotency: `/checkout` requires a client-generated `idempotencyKey` and
 * forwards it to the provider so repeated submits (network retries, double
 * clicks) can never charge twice.
 */

import { Router, type Response } from "express";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  invoicesTable,
  paymentsTable,
  subscriptionsTable,
  usersTable,
} from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { PLAN_CATALOG, findPlan } from "../lib/payments/plans";
import { getProvider, listProviders } from "../lib/payments/registry";
import {
  cancelSubscription,
  getActiveSubscription,
  getPlanRow,
  logAudit,
  recordPayment,
  upsertSubscriptionOnCheckout,
} from "../lib/payments/service";
import { renderInvoicePdf } from "../lib/payments/invoice-pdf";
import { ProviderNotConfiguredError } from "../lib/payments/types";

const router: Router = Router();

/* --------------------------------- Catalog -------------------------------- */

router.get("/payments/plans", (_req, res) => {
  res.json({
    plans: PLAN_CATALOG.map((p) => ({
      plan: p.plan,
      name: p.name,
      nameAr: p.nameAr,
      description: p.description,
      descriptionAr: p.descriptionAr,
      amountMinor: p.amountMinor,
      currency: p.currency,
      interval: p.interval,
      features: p.features,
      featuresAr: p.featuresAr,
      creditsPerCycle: p.limits.creditsPerCycle,
      sortOrder: p.sortOrder,
    })),
  });
});

router.get("/payments/providers", (_req, res) => {
  res.json({ providers: listProviders() });
});

/* ------------------------------- Subscription ----------------------------- */

router.get("/payments/subscription", requireAuth, async (req: AuthRequest, res: Response) => {
  const sub = await getActiveSubscription(req.userId!);
  res.json({ subscription: sub });
});

const CheckoutBody = z.object({
  plan: z.enum(["plus", "pro", "business"]),
  provider: z.enum(["stripe", "paypal", "paymob", "fawry"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  idempotencyKey: z.string().min(8).max(128),
});

router.post("/payments/checkout", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = CheckoutBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body", details: parsed.error.issues });

  const { plan, provider, successUrl, cancelUrl, idempotencyKey } = parsed.data;
  const planCfg = findPlan(plan);
  if (planCfg.amountMinor == null) return res.status(400).json({ error: "plan_not_purchasable" });
  const planRow = await getPlanRow(plan);
  if (!planRow) return res.status(503).json({ error: "plan_not_seeded" });

  // Duplicate-charge guard: refuse if an active subscription for this user is
  // already on the same plan and not canceled — the provider webhook is the
  // source of truth for renewals.
  const current = await getActiveSubscription(req.userId!);
  if (current && current.plan === plan && current.status === "active") {
    return res.status(409).json({ error: "already_subscribed" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) return res.status(404).json({ error: "user_not_found" });

  const impl = getProvider(provider);
  if (!impl.configured) {
    return res.status(503).json({ error: "provider_not_configured", provider });
  }

  try {
    const session = await impl.createCheckoutSession({
      userId: req.userId!,
      userEmail: user.email ?? `${user.username}@example.local`,
      plan,
      currency: planCfg.currency,
      amountMinor: planCfg.amountMinor,
      interval: planCfg.interval,
      successUrl,
      cancelUrl,
      idempotencyKey,
    });

    const sub = await upsertSubscriptionOnCheckout({
      userId: req.userId!,
      plan,
      provider,
      providerSubscriptionId: session.providerSessionId,
    });
    await recordPayment({
      userId: req.userId!,
      subscriptionId: sub.id,
      provider,
      providerPaymentId: session.providerSessionId,
      amountMinor: planCfg.amountMinor,
      currency: planCfg.currency,
      status: "pending",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    await logAudit({
      userId: req.userId!,
      actorId: req.userId!,
      action: "checkout.started",
      provider,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      meta: { plan, sessionId: session.providerSessionId },
    });

    res.json({ redirectUrl: session.redirectUrl, sessionId: session.providerSessionId });
  } catch (err) {
    if (err instanceof ProviderNotConfiguredError) {
      return res.status(503).json({ error: err.code, provider: err.provider });
    }
    return res.status(502).json({ error: "provider_error", message: (err as Error).message });
  }
});

router.post("/payments/subscription/cancel", requireAuth, async (req: AuthRequest, res: Response) => {
  const immediate = z.object({ immediately: z.boolean().optional() }).safeParse(req.body).data?.immediately ?? false;
  const id = await cancelSubscription(req.userId!, immediate);
  if (!id) return res.status(404).json({ error: "no_active_subscription" });
  res.json({ canceled: true, immediate });
});

/* -------------------------------- Invoices -------------------------------- */

router.get("/payments/invoices", requireAuth, async (req: AuthRequest, res: Response) => {
  const rows = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.userId, req.userId!))
    .orderBy(desc(invoicesTable.createdAt))
    .limit(200);
  res.json({ items: rows });
});

router.get("/payments/invoices/:id/pdf", requireAuth, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid_id" });
  const [inv] = await db
    .select()
    .from(invoicesTable)
    .where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, req.userId!)))
    .limit(1);
  if (!inv) return res.status(404).json({ error: "not_found" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const pdf = renderInvoicePdf({
    invoice: inv,
    seller: { name: "Cyber AI", address: process.env.BILLING_SELLER_ADDRESS },
    buyer: { name: user?.username ?? "Customer", email: user?.email ?? "" },
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${inv.number}.pdf"`);
  res.send(pdf);
});

/* ------------------------------- Payment log ------------------------------ */

router.get("/payments/history", requireAuth, async (req: AuthRequest, res: Response) => {
  const rows = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, req.userId!))
    .orderBy(desc(paymentsTable.createdAt))
    .limit(200);
  res.json({ items: rows });
});

export default router;

// Re-export a helper for boot to seed defaults; not part of the API surface.
export { subscriptionsTable };
