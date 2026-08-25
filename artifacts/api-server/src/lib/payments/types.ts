/**
 * Provider-agnostic payment types.
 *
 * All four providers (Stripe, PayPal, Paymob, Fawry) implement the
 * `PaymentProvider` interface below. Each is instantiated lazily in
 * `registry.ts` — a provider whose env keys are missing reports
 * `configured=false` and its methods throw a `ProviderNotConfiguredError`
 * so callers can surface a friendly "Not enabled yet" instead of crashing.
 */

import type { BillingPlan } from "./plans";

export type PaymentProviderId = "stripe" | "paypal" | "paymob" | "fawry";

export interface CheckoutRequest {
  userId: number;
  userEmail: string;
  plan: BillingPlan;
  currency: string;
  amountMinor: number;
  interval: "month" | "year";
  successUrl: string;
  cancelUrl: string;
  /** Idempotency key from the frontend to prevent duplicate charges. */
  idempotencyKey: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  provider: PaymentProviderId;
  /** URL to redirect the user to for hosted checkout. */
  redirectUrl: string;
  /** Provider-side session/order/intent id, for reconciliation. */
  providerSessionId: string;
  expiresAt?: Date;
}

export interface WebhookVerifyResult {
  valid: boolean;
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  reason?: string;
}

export interface RefundRequest {
  providerPaymentId: string;
  amountMinor?: number; // omit for full refund
  reason?: string;
}

export interface RefundResult {
  refundId: string;
  status: "succeeded" | "pending" | "failed";
}

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  /**
   * True only when every required env var is present. When false, the app
   * still boots and lists the provider in `/api/payments/providers` with
   * `enabled: false` so the frontend can gray it out.
   */
  readonly configured: boolean;

  createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession>;

  /**
   * Verify signature and parse the incoming webhook. Handlers MUST call this
   * before doing anything with the payload — the raw body + provider signature
   * header is the trust boundary.
   */
  verifyWebhook(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookVerifyResult>;

  refund(req: RefundRequest): Promise<RefundResult>;
}

export class ProviderNotConfiguredError extends Error {
  code = "PROVIDER_NOT_CONFIGURED" as const;
  constructor(public provider: PaymentProviderId) {
    super(`Payment provider "${provider}" is not configured. Add its API keys to enable it.`);
  }
}
