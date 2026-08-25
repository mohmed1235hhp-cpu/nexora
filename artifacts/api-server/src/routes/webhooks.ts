/**
 * Payment provider webhooks.
 *
 * IMPORTANT: mounted with `express.raw` (see app.ts patch) BEFORE the
 * global `express.json` parser so the raw body remains intact for
 * signature verification. All four providers require exact-byte HMAC/
 * signature checks over the untouched request body.
 *
 * Idempotency: every accepted event is stored in webhook_events keyed by
 * (provider, event_id). A re-delivered event lands as a duplicate insert
 * and is silently acknowledged with 200.
 */

import { Router, type Request, type Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, paymentsTable, subscriptionsTable } from "@workspace/db";
import { getProvider } from "../lib/payments/registry";
import {
  activateSubscription,
  grantPlanBenefits,
  issueInvoice,
  logAudit,
  markWebhookProcessed,
  recordPayment,
  recordWebhookIfNew,
} from "../lib/payments/service";
import type { PaymentProviderId } from "../lib/payments/types";
import { logger } from "../lib/logger";
import { findPlan } from "../lib/payments/plans";

const router: Router = Router();

const ALLOWED: PaymentProviderId[] = ["stripe", "paypal", "paymob", "fawry"];

router.post("/:provider", async (req: Request, res: Response) => {
  const provider = req.params.provider as PaymentProviderId;
  if (!ALLOWED.includes(provider)) return res.status(404).json({ error: "unknown_provider" });

  const impl = getProvider(provider);
  if (!impl.configured) {
    // Silently 200 so the provider stops retrying while the key is missing.
    logger.warn({ provider }, "webhook received for unconfigured provider");
    return res.status(200).json({ received: true, configured: false });
  }

  // With express.raw mounted upstream, req.body is a Buffer of the exact
  // bytes the provider signed. Never JSON-re-serialize as a fallback — that
  // would silently break HMAC comparison for the entire pipeline.
  if (!Buffer.isBuffer(req.body)) {
    logger.error({ provider }, "webhook received without raw body (middleware misordered)");
    return res.status(500).json({ error: "raw_body_missing" });
  }
  const rawBody: Buffer = req.body;

  let verified;
  try {
    verified = await impl.verifyWebhook(rawBody, req.headers);
  } catch (err) {
    logger.error({ err, provider }, "webhook verify threw");
    return res.status(500).json({ error: "verify_error" });
  }

  // Verify signature FIRST — never persist unverified payloads. Storing them
  // pre-verification lets an attacker spam the webhook_events table and
  // (with the previous `eventId ?? evt_<Date.now()>` fallback) also broke
  // idempotency for events that legitimately had no id.
  if (!verified.valid) {
    await logAudit({ action: "webhook.invalid_signature", provider, meta: { reason: verified.reason } });
    return res.status(400).json({ error: "invalid_signature", reason: verified.reason });
  }
  if (!verified.eventId) {
    // Without a stable id we cannot dedupe, so refuse rather than silently
    // fabricating one (previously used `evt_${Date.now()}` — collision-free
    // but idempotency-defeating: every retry re-ran the handler).
    logger.warn({ provider, eventType: verified.eventType }, "webhook missing event id");
    return res.status(400).json({ error: "missing_event_id" });
  }

  const stored = await recordWebhookIfNew({
    provider,
    eventId: verified.eventId,
    eventType: verified.eventType || "unknown",
    signatureValid: true,
    payload: verified.payload,
  });
  if (!stored.isNew) return res.status(200).json({ received: true, duplicate: true });

  try {
    await dispatch(provider, verified.eventType, verified.payload);
    if (stored.id) await markWebhookProcessed(stored.id);
    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err, provider, eventType: verified.eventType }, "webhook processing failed");
    if (stored.id) await markWebhookProcessed(stored.id, (err as Error).message);
    // Return 500 so the provider retries.
    return res.status(500).json({ error: "processing_failed" });
  }
});

/* -------------------------------------------------------------------------- */
/*                            Per-provider dispatch                           */
/* -------------------------------------------------------------------------- */

async function dispatch(provider: PaymentProviderId, eventType: string, payload: Record<string, unknown>) {
  const type = eventType.toLowerCase();

  // Normalize: figure out (userId, plan, providerSessionId) from the payload.
  const ctx = extractContext(provider, payload);
  if (!ctx.providerSessionId) {
    logger.warn({ provider, eventType }, "webhook payload missing session id — cannot correlate");
    return;
  }

  // Correlate to our pending subscription row.
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.providerSubscriptionId, ctx.providerSessionId))
    .limit(1);

  const success =
    type.includes("succeeded") ||
    type.includes("completed") ||
    type.includes("paid") ||
    type.includes("captured") ||
    type.includes("order_paid") ||
    type.includes("order_delivered");

  const failed = type.includes("failed") || type.includes("denied") || type.includes("declined");
  const refunded = type.includes("refund");
  const canceled = type.includes("canceled") || type.includes("cancelled") || type.includes("void");

  if (sub && success) {
    const planCfg = findPlan(sub.plan);
    // Renewal window: interval-driven. For non-recurring providers (Fawry/
    // Paymob) we still stamp a period so the app treats access as active.
    const periodEnd = new Date();
    if (planCfg.interval === "year") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);
    await activateSubscription(sub.id, periodEnd);
    await grantPlanBenefits(sub.userId, sub.plan);
    if (planCfg.amountMinor != null) {
      const invoice = await issueInvoice({
        userId: sub.userId,
        subscriptionId: sub.id,
        amountMinor: planCfg.amountMinor,
        currency: planCfg.currency,
        planName: planCfg.name,
      });
      await recordPayment({
        userId: sub.userId,
        subscriptionId: sub.id,
        provider,
        providerPaymentId: ctx.providerSessionId,
        providerEventId: ctx.eventId,
        amountMinor: planCfg.amountMinor,
        currency: planCfg.currency,
        status: "succeeded",
        metadata: { invoiceId: invoice.id, eventType },
      });
    }
    await logAudit({ userId: sub.userId, action: "payment.succeeded", provider, meta: { eventType } });
    return;
  }

  if (sub && failed) {
    await db
      .update(subscriptionsTable)
      .set({ status: "incomplete", updatedAt: new Date() })
      .where(eq(subscriptionsTable.id, sub.id));
    await recordPayment({
      userId: sub.userId,
      subscriptionId: sub.id,
      provider,
      providerPaymentId: ctx.providerSessionId,
      providerEventId: ctx.eventId,
      amountMinor: 0,
      currency: "USD",
      status: "failed",
      failureReason: eventType,
    });
    await logAudit({ userId: sub.userId, action: "payment.failed", provider, meta: { eventType } });
    return;
  }

  if (sub && refunded) {
    // Scope by (provider, providerPaymentId, userId) so a collision on a
    // provider-side id (extremely unlikely, but the field is not unique
    // per-user) can never flip another customer's payment to refunded.
    await db
      .update(paymentsTable)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(
        and(
          eq(paymentsTable.provider, provider),
          eq(paymentsTable.providerPaymentId, ctx.providerSessionId),
          eq(paymentsTable.userId, sub.userId),
        ),
      );
    await logAudit({ userId: sub.userId, action: "payment.refunded", provider, meta: { eventType } });
    return;
  }

  if (sub && canceled) {
    await db
      .update(subscriptionsTable)
      .set({ status: "canceled", canceledAt: new Date(), endedAt: new Date(), updatedAt: new Date() })
      .where(eq(subscriptionsTable.id, sub.id));
    await logAudit({ userId: sub.userId, action: "subscription.expired", provider, meta: { eventType } });
    return;
  }

  logger.info({ provider, eventType }, "webhook event acknowledged (no state change)");
}

function extractContext(provider: PaymentProviderId, payload: Record<string, unknown>) {
  const dig = (path: string[]) => {
    let cur: unknown = payload;
    for (const p of path) {
      if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else return undefined;
    }
    return cur;
  };
  switch (provider) {
    case "stripe":
      return {
        providerSessionId: (dig(["data", "object", "id"]) as string | undefined) ?? "",
        eventId: (payload.id as string | undefined) ?? "",
      };
    case "paypal":
      return {
        providerSessionId:
          (dig(["resource", "supplementary_data", "related_ids", "order_id"]) as string | undefined) ??
          (dig(["resource", "id"]) as string | undefined) ??
          "",
        eventId: (payload.id as string | undefined) ?? "",
      };
    case "paymob": {
      const obj = payload.obj as Record<string, unknown> | undefined;
      const order = obj?.order as Record<string, unknown> | undefined;
      return {
        providerSessionId: order?.id ? String(order.id) : "",
        eventId: obj?.id ? String(obj.id) : "",
      };
    }
    case "fawry":
      return {
        providerSessionId:
          (payload.merchantRefNumber as string | undefined) ?? (payload.fawryRefNumber as string | undefined) ?? "",
        eventId: (payload.fawryRefNumber as string | undefined) ?? "",
      };
  }
}

export default router;
