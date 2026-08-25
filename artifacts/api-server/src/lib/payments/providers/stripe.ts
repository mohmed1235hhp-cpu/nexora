/**
 * Stripe provider — signature-verified webhooks + hosted Checkout URLs.
 *
 * We DO NOT import the `stripe` npm SDK here so the workspace stays free of
 * heavyweight optional deps. Both operations we need — creating a Checkout
 * Session and verifying webhook signatures — are documented raw HTTP + HMAC
 * calls we can implement directly:
 *   - POST https://api.stripe.com/v1/checkout/sessions
 *   - HMAC-SHA256 over `${timestamp}.${rawBody}` using STRIPE_WEBHOOK_SECRET,
 *     compared to the `t=`/`v1=` parts of the `Stripe-Signature` header.
 *
 * When STRIPE_SECRET_KEY is missing the provider reports configured=false and
 * every method throws ProviderNotConfiguredError.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentProvider,
  RefundRequest,
  RefundResult,
  WebhookVerifyResult,
} from "../types";
import { ProviderNotConfiguredError } from "../types";

const API = "https://api.stripe.com/v1";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const stripeProvider: PaymentProvider = {
  id: "stripe",
  get configured() {
    return !!env("STRIPE_SECRET_KEY");
  },

  async createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession> {
    const secret = env("STRIPE_SECRET_KEY");
    if (!secret) throw new ProviderNotConfiguredError("stripe");

    // Prefer a pre-created recurring price when available; otherwise create
    // an ad-hoc price_data line so the provider can be exercised end-to-end
    // without pre-provisioning in the Stripe dashboard.
    const priceEnv = env(`STRIPE_PRICE_${req.plan.toUpperCase()}`);

    const form = new URLSearchParams();
    form.set("mode", priceEnv ? "subscription" : "payment");
    form.set("success_url", req.successUrl);
    form.set("cancel_url", req.cancelUrl);
    form.set("customer_email", req.userEmail);
    form.set("client_reference_id", String(req.userId));
    form.set("metadata[userId]", String(req.userId));
    form.set("metadata[plan]", req.plan);
    if (req.metadata) {
      for (const [k, v] of Object.entries(req.metadata)) form.set(`metadata[${k}]`, v);
    }

    if (priceEnv) {
      form.set("line_items[0][price]", priceEnv);
      form.set("line_items[0][quantity]", "1");
    } else {
      form.set("line_items[0][price_data][currency]", req.currency.toLowerCase());
      form.set("line_items[0][price_data][unit_amount]", String(req.amountMinor));
      form.set("line_items[0][price_data][product_data][name]", `Cyber AI ${req.plan}`);
      form.set("line_items[0][quantity]", "1");
    }

    const res = await fetch(`${API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": req.idempotencyKey,
      },
      body: form.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Stripe checkout create failed [${res.status}]: ${text}`);
    }
    const json = (await res.json()) as { id: string; url: string; expires_at?: number };
    return {
      provider: "stripe",
      redirectUrl: json.url,
      providerSessionId: json.id,
      expiresAt: json.expires_at ? new Date(json.expires_at * 1000) : undefined,
    };
  },

  async verifyWebhook(rawBody, headers): Promise<WebhookVerifyResult> {
    const secret = env("STRIPE_WEBHOOK_SECRET");
    if (!secret) throw new ProviderNotConfiguredError("stripe");

    const sigHeader = pickHeader(headers, "stripe-signature");
    if (!sigHeader) {
      return { valid: false, eventId: "", eventType: "", payload: {}, reason: "missing signature" };
    }

    // Stripe format: t=timestamp,v1=hash[,v1=hash...]
    const parts = Object.fromEntries(
      sigHeader.split(",").map((p) => {
        const [k, v] = p.split("=");
        return [k, v];
      }),
    );
    const ts = parts.t;
    const expectedList = sigHeader
      .split(",")
      .filter((p) => p.startsWith("v1="))
      .map((p) => p.slice(3));

    if (!ts || expectedList.length === 0) {
      return { valid: false, eventId: "", eventType: "", payload: {}, reason: "malformed signature" };
    }

    const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    const signed = `${ts}.${body}`;
    const computed = createHmac("sha256", secret).update(signed).digest("hex");
    const computedBuf = Buffer.from(computed, "utf8");
    const anyMatch = expectedList.some((sig) => {
      const sigBuf = Buffer.from(sig, "utf8");
      return sigBuf.length === computedBuf.length && timingSafeEqual(sigBuf, computedBuf);
    });

    if (!anyMatch) {
      return { valid: false, eventId: "", eventType: "", payload: {}, reason: "signature mismatch" };
    }

    // Replay window: 5 minutes.
    const skew = Math.abs(Date.now() / 1000 - Number(ts));
    if (skew > 300) {
      return { valid: false, eventId: "", eventType: "", payload: {}, reason: "timestamp too old" };
    }

    const event = JSON.parse(body) as { id: string; type: string; data: unknown };
    return {
      valid: true,
      eventId: event.id,
      eventType: event.type,
      payload: event as unknown as Record<string, unknown>,
    };
  },

  async refund(req: RefundRequest): Promise<RefundResult> {
    const secret = env("STRIPE_SECRET_KEY");
    if (!secret) throw new ProviderNotConfiguredError("stripe");
    const form = new URLSearchParams();
    form.set("payment_intent", req.providerPaymentId);
    if (req.amountMinor != null) form.set("amount", String(req.amountMinor));
    if (req.reason) form.set("reason", "requested_by_customer");
    const res = await fetch(`${API}/refunds`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Stripe refund failed [${res.status}]: ${text}`);
    }
    const json = (await res.json()) as { id: string; status: string };
    return {
      refundId: json.id,
      status: json.status === "succeeded" ? "succeeded" : json.status === "pending" ? "pending" : "failed",
    };
  },
};

function pickHeader(
  headers: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = headers[key] ?? headers[key.toLowerCase()];
  if (Array.isArray(v)) return v[0];
  return v;
}
