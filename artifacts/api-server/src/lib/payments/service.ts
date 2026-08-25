/**
 * Payment orchestration service — glue between provider registry, DB,
 * and downstream systems (credits, audit log).
 *
 * Every DB mutation happens through this file so provider handlers (routes/
 * webhooks) never touch multiple tables in ad-hoc order and forget to run
 * side effects (e.g. crediting the user's account when a payment succeeds).
 */

import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  billingAuditLogTable,
  invoicesTable,
  paymentsTable,
  subscriptionPlansTable,
  subscriptionsTable,
  userCreditsTable,
  webhookEventsTable,
} from "@workspace/db";
import type {
  BillingPlan,
  PlanConfig,
} from "./plans";
import { PLAN_CATALOG } from "./plans";
import type { PaymentProviderId } from "./types";
import { logger } from "../logger";

/* -------------------------------------------------------------------------- */
/*                         Catalog seeding (idempotent)                       */
/* -------------------------------------------------------------------------- */

export async function seedPlansIfEmpty(): Promise<void> {
  const existing = await db.select({ id: subscriptionPlansTable.id }).from(subscriptionPlansTable).limit(1);
  if (existing.length > 0) return;

  const rows = PLAN_CATALOG.map((p: PlanConfig) => ({
    plan: p.plan,
    name: p.name,
    description: p.description,
    amountMinor: p.amountMinor,
    currency: p.currency,
    interval: p.interval,
    creditsPerCycle: p.limits.creditsPerCycle,
    features: p.features,
    providerPriceIds: {},
    active: true,
    sortOrder: p.sortOrder,
  }));
  await db.insert(subscriptionPlansTable).values(rows);
  logger.info({ count: rows.length }, "billing: seeded subscription_plans");
}

export async function getPlanRow(plan: BillingPlan) {
  const [row] = await db
    .select()
    .from(subscriptionPlansTable)
    .where(and(eq(subscriptionPlansTable.plan, plan), eq(subscriptionPlansTable.active, true)))
    .limit(1);
  return row ?? null;
}

/* -------------------------------------------------------------------------- */
/*                                Subscriptions                               */
/* -------------------------------------------------------------------------- */

export async function getActiveSubscription(userId: number) {
  const [row] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);
  return row ?? null;
}

export async function upsertSubscriptionOnCheckout(params: {
  userId: number;
  plan: BillingPlan;
  provider: PaymentProviderId;
  providerSubscriptionId?: string;
  providerCustomerId?: string;
}) {
  const planRow = await getPlanRow(params.plan);
  if (!planRow) throw new Error(`Plan ${params.plan} not seeded`);

  // Function is named "upsert" but previously always INSERTed, producing a
  // fresh row on every retried/double-clicked checkout — so a user who
  // reloaded the checkout page ended up with N `incomplete` subscription
  // rows and the webhook could only ever activate the latest one. Reuse an
  // existing `incomplete` row for the same (user, provider, plan) instead.
  const [existing] = await db
    .select()
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.userId, params.userId),
        eq(subscriptionsTable.provider, params.provider),
        eq(subscriptionsTable.plan, params.plan),
        eq(subscriptionsTable.status, "incomplete"),
      ),
    )
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(subscriptionsTable)
      .set({
        providerSubscriptionId: params.providerSubscriptionId ?? existing.providerSubscriptionId,
        providerCustomerId: params.providerCustomerId ?? existing.providerCustomerId,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.id, existing.id))
      .returning();
    return updated;
  }

  const [row] = await db
    .insert(subscriptionsTable)
    .values({
      userId: params.userId,
      planId: planRow.id,
      plan: params.plan,
      status: "incomplete",
      provider: params.provider,
      providerSubscriptionId: params.providerSubscriptionId,
      providerCustomerId: params.providerCustomerId,
      autoRenew: true,
    })
    .returning();
  return row;
}

export async function activateSubscription(subscriptionId: number, periodEnd: Date) {
  await db
    .update(subscriptionsTable)
    .set({
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.id, subscriptionId));
}

export async function cancelSubscription(userId: number, immediately: boolean) {
  const sub = await getActiveSubscription(userId);
  if (!sub) return null;
  const patch = immediately
    ? { status: "canceled" as const, canceledAt: new Date(), endedAt: new Date(), autoRenew: false }
    : { canceledAt: new Date(), autoRenew: false };
  await db.update(subscriptionsTable).set({ ...patch, updatedAt: new Date() }).where(eq(subscriptionsTable.id, sub.id));
  await logAudit({ userId, actorId: userId, action: "subscription.canceled", meta: { immediately } });
  return sub.id;
}

/* -------------------------------------------------------------------------- */
/*                                  Payments                                  */
/* -------------------------------------------------------------------------- */

export async function recordPayment(params: {
  userId: number;
  subscriptionId?: number;
  provider: PaymentProviderId;
  providerPaymentId?: string;
  providerEventId?: string;
  amountMinor: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded" | "chargeback" | "canceled";
  failureReason?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  const [row] = await db.insert(paymentsTable).values(params).returning();
  return row;
}

/* -------------------------------------------------------------------------- */
/*                                  Invoices                                  */
/* -------------------------------------------------------------------------- */

export async function issueInvoice(params: {
  userId: number;
  subscriptionId?: number;
  amountMinor: number;
  currency: string;
  planName: string;
}) {
  // Human-friendly + globally unique. Previously used only the last 8
  // digits of Date.now(), which collides across concurrent invoices in
  // the same ~2h window (the unique index would then reject one of them
  // and the caller saw a 500). Append 6 random hex chars for entropy.
  const number = `INV-${new Date().getFullYear()}-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
  const [row] = await db
    .insert(invoicesTable)
    .values({
      userId: params.userId,
      subscriptionId: params.subscriptionId,
      number,
      status: "paid",
      amountMinor: params.amountMinor,
      totalMinor: params.amountMinor,
      currency: params.currency,
      paidAt: new Date(),
      lineItems: [
        { description: `${params.planName} subscription`, quantity: 1, unitAmountMinor: params.amountMinor },
      ],
    })
    .returning();
  return row;
}

/* -------------------------------------------------------------------------- */
/*                                 Credits sync                               */
/* -------------------------------------------------------------------------- */

/**
 * When a subscription payment succeeds, grant the plan's monthly credit
 * bundle and set the user's `plan` column on user_credits so downstream
 * feature gates (videoLimits, priority queue) see the right tier.
 *
 * Note: the existing user_plan enum only knows `free|premium|pro` — we map
 * `plus -> premium`, `pro -> pro`, `business -> pro` for backward compat.
 */
export async function grantPlanBenefits(userId: number, plan: BillingPlan): Promise<void> {
  const cfg = PLAN_CATALOG.find((p) => p.plan === plan);
  if (!cfg) return;

  const legacyPlan: "free" | "premium" | "pro" =
    plan === "free" ? "free" : plan === "plus" ? "premium" : "pro";

  const [existing] = await db.select().from(userCreditsTable).where(eq(userCreditsTable.userId, userId)).limit(1);
  if (!existing) {
    await db.insert(userCreditsTable).values({
      userId,
      balance: cfg.limits.creditsPerCycle > 0 ? cfg.limits.creditsPerCycle : 100,
      plan: legacyPlan,
    });
    return;
  }
  await db
    .update(userCreditsTable)
    .set({
      balance: existing.balance + cfg.limits.creditsPerCycle,
      plan: legacyPlan,
      lastResetAt: new Date(),
    })
    .where(eq(userCreditsTable.userId, userId));
}

/* -------------------------------------------------------------------------- */
/*                              Webhook idempotency                           */
/* -------------------------------------------------------------------------- */

export async function recordWebhookIfNew(params: {
  provider: PaymentProviderId;
  eventId: string;
  eventType: string;
  signatureValid: boolean;
  payload: Record<string, unknown>;
}): Promise<{ isNew: boolean; id?: number }> {
  try {
    const [row] = await db
      .insert(webhookEventsTable)
      .values({
        provider: params.provider,
        eventId: params.eventId,
        eventType: params.eventType,
        signatureValid: params.signatureValid,
        payload: params.payload,
      })
      .returning({ id: webhookEventsTable.id });
    return { isNew: true, id: row.id };
  } catch (err) {
    // Only treat a UNIQUE (provider, event_id) violation as "duplicate
    // delivery, already handled". Any other DB error (connection loss,
    // constraint change, permission) must propagate so the provider
    // retries — silently swallowing them made real failures look like
    // successful idempotent hits and dropped payments on the floor.
    const code = (err as { code?: string } | null)?.code;
    if (code === "23505") {
      logger.debug({ provider: params.provider, eventId: params.eventId }, "webhook duplicate ignored");
      return { isNew: false };
    }
    logger.error({ err, provider: params.provider, eventId: params.eventId }, "webhook persist failed");
    throw err;
  }
}

export async function markWebhookProcessed(id: number, error?: string): Promise<void> {
  await db
    .update(webhookEventsTable)
    .set({ processed: !error, processingError: error ?? null, processedAt: new Date() })
    .where(eq(webhookEventsTable.id, id));
}

/* -------------------------------------------------------------------------- */
/*                                   Audit                                    */
/* -------------------------------------------------------------------------- */

export async function logAudit(params: {
  userId?: number | null;
  actorId?: number | null;
  action: string;
  provider?: PaymentProviderId;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(billingAuditLogTable).values({
      userId: params.userId ?? null,
      actorId: params.actorId ?? null,
      action: params.action,
      provider: params.provider,
      ip: params.ip,
      userAgent: params.userAgent,
      meta: params.meta ?? {},
    });
  } catch (err) {
    logger.error({ err, action: params.action }, "billing audit persist failed");
  }
}
