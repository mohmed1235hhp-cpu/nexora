/**
 * Payment provider registry — single source used by routes and webhooks.
 * Providers self-report `configured` from env, so no runtime toggle is
 * required beyond setting API keys.
 */
import { stripeProvider } from "./providers/stripe";
import { paypalProvider } from "./providers/paypal";
import { paymobProvider } from "./providers/paymob";
import { fawryProvider } from "./providers/fawry";
import type { PaymentProvider, PaymentProviderId } from "./types";

const providers: Record<PaymentProviderId, PaymentProvider> = {
  stripe: stripeProvider,
  paypal: paypalProvider,
  paymob: paymobProvider,
  fawry: fawryProvider,
};

export function getProvider(id: PaymentProviderId): PaymentProvider {
  return providers[id];
}

export function listProviders(): Array<{
  id: PaymentProviderId;
  enabled: boolean;
  currency: "USD" | "EGP";
  scope: "global" | "egypt";
}> {
  return [
    { id: "stripe", enabled: providers.stripe.configured, currency: "USD", scope: "global" },
    { id: "paypal", enabled: providers.paypal.configured, currency: "USD", scope: "global" },
    { id: "paymob", enabled: providers.paymob.configured, currency: "EGP", scope: "egypt" },
    { id: "fawry", enabled: providers.fawry.configured, currency: "EGP", scope: "egypt" },
  ];
}
