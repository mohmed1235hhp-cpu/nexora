/**
 * Paymob (Egypt) provider.
 *
 * Paymob's classic flow is a 3-step handshake:
 *   1) POST /api/auth/tokens with PAYMOB_API_KEY   → auth_token
 *   2) POST /api/ecommerce/orders                  → order_id
 *   3) POST /api/acceptance/payment_keys           → payment_token
 * The user is then redirected to the iframe / mobile wallet acceptance page:
 *   https://accept.paymob.com/api/acceptance/iframes/{iframe_id}?payment_token=...
 *
 * Webhooks (Paymob calls them "transaction callbacks") are HMAC-signed with
 * PAYMOB_HMAC_SECRET over a documented concatenation of transaction fields.
 * We validate that HMAC before touching the payload.
 *
 * Env inputs (all optional; provider disabled if any missing):
 *   PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID_CARD, PAYMOB_INTEGRATION_ID_WALLET,
 *   PAYMOB_IFRAME_ID, PAYMOB_HMAC_SECRET
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

const BASE = "https://accept.paymob.com";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const paymobProvider: PaymentProvider = {
  id: "paymob",
  get configured() {
    return !!(
      env("PAYMOB_API_KEY") &&
      env("PAYMOB_INTEGRATION_ID_CARD") &&
      env("PAYMOB_IFRAME_ID") &&
      env("PAYMOB_HMAC_SECRET")
    );
  },

  async createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession> {
    if (!this.configured) throw new ProviderNotConfiguredError("paymob");
    const apiKey = env("PAYMOB_API_KEY")!;
    const integrationId = env("PAYMOB_INTEGRATION_ID_CARD")!;
    const iframeId = env("PAYMOB_IFRAME_ID")!;

    // Step 1 — auth
    const auth = await fetch(`${BASE}/api/auth/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    }).then(assertJson<{ token: string }>);

    // Step 2 — order
    const order = await fetch(`${BASE}/api/ecommerce/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: auth.token,
        delivery_needed: false,
        amount_cents: req.amountMinor,
        currency: req.currency,
        merchant_order_id: `${req.userId}-${req.idempotencyKey}`,
        items: [],
      }),
    }).then(assertJson<{ id: number }>);

    // Step 3 — payment key
    const key = await fetch(`${BASE}/api/acceptance/payment_keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: auth.token,
        amount_cents: req.amountMinor,
        expiration: 3600,
        order_id: order.id,
        billing_data: {
          email: req.userEmail,
          first_name: "AI",
          last_name: "Cyber AI",
          phone_number: "+201000000000",
          country: "EG",
          city: "Cairo",
          street: "NA",
          building: "NA",
          floor: "NA",
          apartment: "NA",
        },
        currency: req.currency,
        integration_id: Number(integrationId),
      }),
    }).then(assertJson<{ token: string }>);

    return {
      provider: "paymob",
      redirectUrl: `${BASE}/api/acceptance/iframes/${iframeId}?payment_token=${key.token}`,
      providerSessionId: String(order.id),
    };
  },

  async verifyWebhook(rawBody, _headers): Promise<WebhookVerifyResult> {
    if (!this.configured) throw new ProviderNotConfiguredError("paymob");
    const secret = env("PAYMOB_HMAC_SECRET")!;
    const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    let event: { hmac?: string; obj?: Record<string, unknown> };
    try {
      event = JSON.parse(body);
    } catch {
      return { valid: false, eventId: "", eventType: "", payload: {}, reason: "invalid JSON" };
    }

    const obj = event.obj as Record<string, unknown> | undefined;
    const receivedHmac = event.hmac ?? "";
    if (!obj || !receivedHmac) {
      return { valid: false, eventId: "", eventType: "", payload: {}, reason: "missing hmac/obj" };
    }

    // Paymob's documented concatenation order for the transaction webhook.
    // Reference: https://developers.paymob.com/egypt/api-reference-guide/transaction-callback
    const fields = [
      "amount_cents",
      "created_at",
      "currency",
      "error_occured",
      "has_parent_transaction",
      "id",
      "integration_id",
      "is_3d_secure",
      "is_auth",
      "is_capture",
      "is_refunded",
      "is_standalone_payment",
      "is_voided",
      "order.id",
      "owner",
      "pending",
      "source_data.pan",
      "source_data.sub_type",
      "source_data.type",
      "success",
    ];
    const concat = fields.map((f) => stringifyPath(obj, f)).join("");
    const computed = createHmac("sha512", secret).update(concat).digest("hex");
    const a = Buffer.from(computed, "utf8");
    const b = Buffer.from(receivedHmac, "utf8");
    const valid = a.length === b.length && timingSafeEqual(a, b);

    return {
      valid,
      eventId: String((obj as { id?: unknown }).id ?? ""),
      eventType: (obj as { success?: boolean }).success ? "TRANSACTION_SUCCEEDED" : "TRANSACTION_FAILED",
      payload: event as unknown as Record<string, unknown>,
      reason: valid ? undefined : "HMAC mismatch",
    };
  },

  async refund(_req: RefundRequest): Promise<RefundResult> {
    // Paymob refunds require a merchant-side voiding call. Left as a stub
    // returning a documented "pending" so operators can complete the refund
    // from the Paymob dashboard while the webhook then reconciles state.
    if (!this.configured) throw new ProviderNotConfiguredError("paymob");
    return { refundId: "manual", status: "pending" };
  },
};

async function assertJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Paymob request failed [${res.status}]: ${await res.text()}`);
  return (await res.json()) as T;
}

function stringifyPath(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      cur = "";
      break;
    }
  }
  if (cur === null || cur === undefined) return "";
  if (typeof cur === "boolean") return cur ? "true" : "false";
  return String(cur);
}
