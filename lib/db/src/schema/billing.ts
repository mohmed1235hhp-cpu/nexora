/**
 * Billing & Payments schema.
 *
 * Introduced by the enterprise payments upgrade. Follows the same drizzle
 * patterns used across the rest of `lib/db/src/schema/*` — snake_case
 * columns, integer FKs to usersTable, `pgEnum` for closed value sets, and
 * drizzle-zod for insert schemas.
 *
 * Design notes
 * ------------
 * - `billing_plan` and `subscription_status` are new enums that live
 *   alongside (not replacing) the existing `user_plan` enum in credits.ts
 *   so no existing code that reads `userCreditsTable.plan` breaks.
 * - `payments` records every attempt (success/failed/refunded). Providers
 *   dedupe via (provider, provider_event_id) — used to make webhooks
 *   idempotent without a separate lookup layer.
 * - `webhook_events` stores the raw provider payload so we can replay a
 *   failed handler safely, and enforces idempotency via a UNIQUE
 *   (provider, event_id).
 * - `audit_log_billing` mirrors the structured audit() logger, persisted
 *   for compliance and admin review.
 * - Amounts are stored as integers in the currency's minor unit (cents /
 *   piastres) to avoid floating-point drift.
 */
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/* -------------------------------------------------------------------------- */
/*                                  Enums                                     */
/* -------------------------------------------------------------------------- */

export const billingPlanEnum = pgEnum("billing_plan", [
  "free",
  "plus",
  "pro",
  "business",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "expired",
  "incomplete",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "stripe",
  "paypal",
  "paymob",
  "fawry",
  "manual",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
  "chargeback",
  "canceled",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "void",
  "uncollectible",
]);

/* -------------------------------------------------------------------------- */
/*                             Subscription plans                             */
/* -------------------------------------------------------------------------- */
/**
 * A catalog row per (billing_plan, currency, interval) combination. Kept in
 * the DB (not hard-coded in code alone) so admins can add localized prices
 * without a redeploy. The `plans.ts` config in api-server seeds this table
 * on boot if empty.
 */
export const subscriptionPlansTable = pgTable(
  "subscription_plans",
  {
    id: serial("id").primaryKey(),
    plan: billingPlanEnum("plan").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    // Minor units (e.g. 999 = 9.99). `null` for the free plan.
    amountMinor: integer("amount_minor"),
    currency: text("currency").notNull().default("USD"),
    interval: text("interval").notNull().default("month"), // month | year
    creditsPerCycle: integer("credits_per_cycle").notNull().default(0),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    // Per-provider price IDs (Stripe price_xxx, Paymob integration IDs, etc.)
    providerPriceIds: jsonb("provider_price_ids").$type<Record<string, string>>().notNull().default({}),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    planCurrencyIntervalIdx: uniqueIndex("subscription_plans_plan_currency_interval_idx").on(
      t.plan,
      t.currency,
      t.interval,
    ),
  }),
);

export type SubscriptionPlan = typeof subscriptionPlansTable.$inferSelect;

/* -------------------------------------------------------------------------- */
/*                             User subscriptions                             */
/* -------------------------------------------------------------------------- */

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    planId: integer("plan_id")
      .notNull()
      .references(() => subscriptionPlansTable.id, { onDelete: "restrict" }),
    plan: billingPlanEnum("plan").notNull(),
    status: subscriptionStatusEnum("status").notNull().default("incomplete"),
    provider: paymentProviderEnum("provider").notNull(),
    providerSubscriptionId: text("provider_subscription_id"),
    providerCustomerId: text("provider_customer_id"),
    // Renewal window
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    // If true the sub renews at currentPeriodEnd automatically.
    autoRenew: boolean("auto_renew").notNull().default(true),
    // Requested-cancellation timestamp; the row keeps `status=active` until
    // currentPeriodEnd so paid access isn't lost mid-cycle.
    canceledAt: timestamp("canceled_at"),
    // Populated when a webhook confirms termination.
    endedAt: timestamp("ended_at"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index("subscriptions_user_id_idx").on(t.userId),
    providerSubIdx: uniqueIndex("subscriptions_provider_sub_idx").on(
      t.provider,
      t.providerSubscriptionId,
    ),
  }),
);

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;

/* -------------------------------------------------------------------------- */
/*                                Payments                                    */
/* -------------------------------------------------------------------------- */

export const paymentsTable = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    subscriptionId: integer("subscription_id").references(() => subscriptionsTable.id, {
      onDelete: "set null",
    }),
    invoiceId: integer("invoice_id"),
    provider: paymentProviderEnum("provider").notNull(),
    // Provider's charge/intent ID — used for reconciliation and refunds.
    providerPaymentId: text("provider_payment_id"),
    // (provider, event_id) UNIQUE guarantees webhook idempotency.
    providerEventId: text("provider_event_id"),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    failureReason: text("failure_reason"),
    // The originating client IP + user agent, for fraud/audit.
    ip: text("ip"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index("payments_user_id_idx").on(t.userId),
    providerEventIdx: uniqueIndex("payments_provider_event_idx").on(
      t.provider,
      t.providerEventId,
    ),
  }),
);

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;

/* -------------------------------------------------------------------------- */
/*                                Invoices                                    */
/* -------------------------------------------------------------------------- */

export const invoicesTable = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    subscriptionId: integer("subscription_id").references(() => subscriptionsTable.id, {
      onDelete: "set null",
    }),
    // Human-friendly invoice number, e.g. INV-2026-000123. Unique per tenant.
    number: text("number").notNull(),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    amountMinor: integer("amount_minor").notNull(),
    taxMinor: integer("tax_minor").notNull().default(0),
    totalMinor: integer("total_minor").notNull(),
    currency: text("currency").notNull(),
    dueAt: timestamp("due_at"),
    paidAt: timestamp("paid_at"),
    // Snapshot of billing address / customer info at invoice time.
    billingSnapshot: jsonb("billing_snapshot")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    lineItems: jsonb("line_items")
      .$type<Array<{ description: string; quantity: number; unitAmountMinor: number }>>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    numberIdx: uniqueIndex("invoices_number_idx").on(t.number),
    userIdIdx: index("invoices_user_id_idx").on(t.userId),
  }),
);

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;

/* -------------------------------------------------------------------------- */
/*                             Webhook events                                 */
/* -------------------------------------------------------------------------- */
/**
 * Persisted raw webhook payloads. The (provider, event_id) UNIQUE index is
 * the idempotency guarantee — a re-delivered webhook lands as a duplicate
 * insert and is silently ignored by the handler.
 */
export const webhookEventsTable = pgTable(
  "webhook_events",
  {
    id: serial("id").primaryKey(),
    provider: paymentProviderEnum("provider").notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    signatureValid: boolean("signature_valid").notNull().default(false),
    processed: boolean("processed").notNull().default(false),
    processingError: text("processing_error"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    receivedAt: timestamp("received_at").notNull().defaultNow(),
    processedAt: timestamp("processed_at"),
  },
  (t) => ({
    providerEventIdx: uniqueIndex("webhook_events_provider_event_idx").on(
      t.provider,
      t.eventId,
    ),
  }),
);

export type WebhookEvent = typeof webhookEventsTable.$inferSelect;

/* -------------------------------------------------------------------------- */
/*                         Billing audit log (persisted)                      */
/* -------------------------------------------------------------------------- */

export const billingAuditLogTable = pgTable(
  "billing_audit_log",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    actorId: integer("actor_id").references(() => usersTable.id, { onDelete: "set null" }),
    action: text("action").notNull(), // e.g. subscription.created, payment.refunded
    provider: paymentProviderEnum("provider"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index("billing_audit_log_user_id_idx").on(t.userId),
    actionIdx: index("billing_audit_log_action_idx").on(t.action),
  }),
);

export type BillingAuditLog = typeof billingAuditLogTable.$inferSelect;
