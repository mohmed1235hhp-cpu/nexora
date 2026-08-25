/**
 * PayPal provider — Orders v2 + Webhook signature verification.
 *
 * Uses PayPal's REST endpoints directly (no SDK) so the workspace stays
 * dependency-lean. The three env inputs required to enable it:
 *   - PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET (OAuth2 client credentials)
 *   - PAYPAL_WEBHOOK_ID (returned by PayPal when the webhook is registered)
 * With any of the above missing, `configured=false` and methods throw.
 *
 * NOTE on webhook verification: PayPal's docs recommend calling the
 * `/v1/notifications/verify-webhook-signature` endpoint with the raw body
 * and signature headers. We do exactly that — no local HMAC — so signature
 * validation always matches PayPal's own crypto.
 */

import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentProvider,
  RefundRequest,
  RefundResult,
  WebhookVerifyResult,
} from "../types";
import { ProviderNotConfiguredError } from "../types";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function baseUrl(): string {
  return env("PAYPAL_ENV") === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const id = env("PAYPAL_CLIENT_ID");
  const secret = env("PAYPAL_CLIENT_SECRET");
  if (!id || !secret) throw new ProviderNotConfiguredError("paypal");
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal OAuth failed: ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export const paypalProvider: PaymentProvider = {
  id: "paypal",
  get configured() {
    return !!(env("PAYPAL_CLIENT_ID") && env("PAYPAL_CLIENT_SECRET") && env("PAYPAL_WEBHOOK_ID"));
  },

  async createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession> {
    if (!this.configured) throw new ProviderNotConfiguredError("paypal");
    const token = await getAccessToken();

    const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": req.idempotencyKey, // PayPal's idempotency header
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `plan:${req.plan}`,
            custom_id: String(req.userId),
            amount: {
              currency_code: req.currency,
              value: (req.amountMinor / 100).toFixed(2),
            },
            description: `Cyber AI ${req.plan} subscription`,
          },
        ],
        application_context: {
          return_url: req.successUrl,
          cancel_url: req.cancelUrl,
          user_action: "PAY_NOW",
          brand_name: "Cyber AI",
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PayPal order create failed [${res.status}]: ${text}`);
    }
    const json = (await res.json()) as { id: string; links: Array<{ rel: string; href: string }> };
    const approve = json.links.find((l) => l.rel === "approve");
    if (!approve) throw new Error("PayPal did not return an approve link");
    return { provider: "paypal", redirectUrl: approve.href, providerSessionId: json.id };
  },

  async verifyWebhook(rawBody, headers): Promise<WebhookVerifyResult> {
    if (!this.configured) throw new ProviderNotConfiguredError("paypal");
    const webhookId = env("PAYPAL_WEBHOOK_ID")!;
    const token = await getAccessToken();

    const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    const event = (() => {
      try {
        return JSON.parse(body) as { id: string; event_type: string };
      } catch {
        return null;
      }
    })();
    if (!event) return { valid: false, eventId: "", eventType: "", payload: {}, reason: "invalid JSON" };

    const verifyRes = await fetch(`${baseUrl()}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_algo: pick(headers, "paypal-auth-algo"),
        cert_url: pick(headers, "paypal-cert-url"),
        transmission_id: pick(headers, "paypal-transmission-id"),
        transmission_sig: pick(headers, "paypal-transmission-sig"),
        transmission_time: pick(headers, "paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: event,
      }),
    });

    const result = (await verifyRes.json()) as { verification_status?: string };
    const valid = result.verification_status === "SUCCESS";
    return {
      valid,
      eventId: event.id,
      eventType: event.event_type,
      payload: event as unknown as Record<string, unknown>,
      reason: valid ? undefined : "PayPal verify-webhook-signature returned FAILURE",
    };
  },

  async refund(req: RefundRequest): Promise<RefundResult> {
    if (!this.configured) throw new ProviderNotConfiguredError("paypal");
    const token = await getAccessToken();
    const res = await fetch(`${baseUrl()}/v2/payments/captures/${req.providerPaymentId}/refund`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(
        req.amountMinor != null
          ? { amount: { value: (req.amountMinor / 100).toFixed(2), currency_code: "USD" } }
          : {},
      ),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PayPal refund failed [${res.status}]: ${text}`);
    }
    const json = (await res.json()) as { id: string; status: string };
    return {
      refundId: json.id,
      status: json.status === "COMPLETED" ? "succeeded" : json.status === "PENDING" ? "pending" : "failed",
    };
  },
};

function pick(
  headers: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = headers[key] ?? headers[key.toLowerCase()];
  if (Array.isArray(v)) return v[0];
  return v;
}
