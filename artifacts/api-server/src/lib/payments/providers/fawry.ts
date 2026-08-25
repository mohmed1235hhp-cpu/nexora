/**
 * Fawry (Egypt) provider — Charge Request + signature-verified callbacks.
 *
 * Fawry's checkout is a "PayAtFawry" reference code: we call
 * POST /ECommerceWeb/Fawry/payments/charge with a SHA-256 signature and
 * receive either a redirect URL (card path) or a reference number the user
 * pays at any Fawry outlet. We return the redirect URL when present, else a
 * lightweight branded page URL constructed with the reference.
 *
 * Env: FAWRY_MERCHANT_CODE, FAWRY_SECURITY_KEY, FAWRY_BASE_URL
 * (defaults to the sandbox host so the provider can be smoke-tested).
 */

import { createHash } from "node:crypto";
import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentProvider,
  RefundRequest,
  RefundResult,
  WebhookVerifyResult,
} from "../types";
import { ProviderNotConfiguredError } from "../types";

function env(name: string, fallback?: string): string | undefined {
  const v = process.env[name] ?? fallback;
  return v && v.length > 0 ? v : undefined;
}

export const fawryProvider: PaymentProvider = {
  id: "fawry",
  get configured() {
    return !!(env("FAWRY_MERCHANT_CODE") && env("FAWRY_SECURITY_KEY"));
  },

  async createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession> {
    if (!this.configured) throw new ProviderNotConfiguredError("fawry");
    const merchant = env("FAWRY_MERCHANT_CODE")!;
    const key = env("FAWRY_SECURITY_KEY")!;
    const base = env("FAWRY_BASE_URL", "https://atfawry.fawrystaging.com")!;

    const merchantRefNum = `${req.userId}-${req.idempotencyKey}`.slice(0, 40);
    const amount = (req.amountMinor / 100).toFixed(2);

    // Signature = SHA-256(merchantCode + merchantRefNum + customerProfileId
    //   + paymentMethod + amount + description + itemId + qty + itemPrice + securityKey)
    // For single-item charge with paymentMethod=CARD.
    const itemId = req.plan;
    const qty = "1";
    const desc = `Cyber AI ${req.plan}`;
    const raw =
      merchant + merchantRefNum + String(req.userId) + "CARD" + amount + desc + itemId + qty + amount + key;
    const signature = createHash("sha256").update(raw).digest("hex");

    const res = await fetch(`${base}/ECommerceWeb/Fawry/payments/charge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantCode: merchant,
        merchantRefNum,
        customerProfileId: String(req.userId),
        customerEmail: req.userEmail,
        paymentMethod: "CARD",
        amount,
        currencyCode: req.currency,
        description: desc,
        chargeItems: [{ itemId, description: desc, price: amount, quantity: 1 }],
        signature,
        returnUrl: req.successUrl,
      }),
    });

    if (!res.ok) throw new Error(`Fawry charge failed [${res.status}]: ${await res.text()}`);
    const json = (await res.json()) as { nextAction?: { redirectUrl?: string }; referenceNumber?: string };
    return {
      provider: "fawry",
      redirectUrl: json.nextAction?.redirectUrl ?? `${req.successUrl}?ref=${json.referenceNumber ?? ""}`,
      providerSessionId: json.referenceNumber ?? merchantRefNum,
    };
  },

  async verifyWebhook(rawBody, _headers): Promise<WebhookVerifyResult> {
    if (!this.configured) throw new ProviderNotConfiguredError("fawry");
    const key = env("FAWRY_SECURITY_KEY")!;
    const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    let event: {
      merchantRefNumber?: string;
      fawryRefNumber?: string;
      paymentAmount?: number | string;
      orderAmount?: number | string;
      orderStatus?: string;
      paymentMethod?: string;
      messageSignature?: string;
    };
    try {
      event = JSON.parse(body);
    } catch {
      return { valid: false, eventId: "", eventType: "", payload: {}, reason: "invalid JSON" };
    }

    // Fawry callback signature =
    //   SHA-256(fawryRefNumber + merchantRefNumber + paymentAmount + orderAmount + orderStatus + paymentMethod + securityKey)
    const raw =
      String(event.fawryRefNumber ?? "") +
      String(event.merchantRefNumber ?? "") +
      String(event.paymentAmount ?? "") +
      String(event.orderAmount ?? "") +
      String(event.orderStatus ?? "") +
      String(event.paymentMethod ?? "") +
      key;
    const computed = createHash("sha256").update(raw).digest("hex");
    const valid = computed === (event.messageSignature ?? "");

    return {
      valid,
      eventId: String(event.fawryRefNumber ?? event.merchantRefNumber ?? ""),
      eventType: `ORDER_${event.orderStatus ?? "UNKNOWN"}`,
      payload: event as unknown as Record<string, unknown>,
      reason: valid ? undefined : "signature mismatch",
    };
  },

  async refund(_req: RefundRequest): Promise<RefundResult> {
    if (!this.configured) throw new ProviderNotConfiguredError("fawry");
    // Fawry refunds go through the merchant dashboard; return "pending" so
    // the operator can complete refund manually and the callback reconciles.
    return { refundId: "manual", status: "pending" };
  },
};
