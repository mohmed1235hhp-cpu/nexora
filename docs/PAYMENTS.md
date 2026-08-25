# Payments & Subscriptions

This module was added by the "enterprise payments upgrade". It is fully
integrated with the existing users, credits, and admin systems — but every
provider is **disabled by default** and comes online the moment you add its
API keys to the environment.

## Plans

Defined once in `artifacts/api-server/src/lib/payments/plans.ts`:

| Plan     | Price      | Credits / cycle | Notes                     |
| -------- | ---------- | --------------- | ------------------------- |
| Free     | 0          | 0 (100 daily)   | default for every user    |
| Plus     | $9.99 / mo | 3,000           | priority queue            |
| Pro      | $29.99 /mo | 12,000          | fast lane + API access    |
| Business | $99.99 /mo | 50,000          | dedicated + 5 team seats  |

Plans are seeded into `subscription_plans` on the first boot after migration.

## Providers

| Provider | Scope   | Env keys (all required to enable)                                                                            |
| -------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| Stripe   | Global  | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, optional `STRIPE_PRICE_PLUS/PRO/BUSINESS`                       |
| PayPal   | Global  | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, optional `PAYPAL_ENV=live`                    |
| Paymob   | Egypt   | `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID_CARD`, `PAYMOB_INTEGRATION_ID_WALLET`, `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET` |
| Fawry    | Egypt   | `FAWRY_MERCHANT_CODE`, `FAWRY_SECURITY_KEY`, optional `FAWRY_BASE_URL`                                        |

`/api/payments/providers` reports live-configured status so the pricing UI
grays out unavailable methods.

## Webhooks

All providers POST to `/api/webhooks/:provider`. The route:

1. Loads the provider from the registry.
2. Reads the raw body (mounted before `express.json`).
3. Calls `provider.verifyWebhook(rawBody, headers)` — HMAC/API signature check.
4. Inserts into `webhook_events` keyed by `(provider, event_id)` — idempotent.
5. Dispatches success / failure / refund / cancel to the shared handlers in
   `service.ts` which update subscriptions, issue invoices, and grant credits.

Configure the provider dashboards to point at:

```
https://<your-domain>/api/webhooks/stripe
https://<your-domain>/api/webhooks/paypal
https://<your-domain>/api/webhooks/paymob
https://<your-domain>/api/webhooks/fawry
```

## Data model

New tables (all created by the same drizzle push as the rest of the schema):

- `subscription_plans` — catalog
- `subscriptions` — one row per user subscription attempt/active
- `payments` — every attempt (pending/succeeded/failed/refunded)
- `invoices` — issued after a successful payment; downloadable as PDF
- `webhook_events` — raw payloads for replay + idempotency guarantee
- `billing_audit_log` — persisted audit trail alongside the structured logger

## Frontend pages

- `/pricing` — plan grid, provider selector
- `/billing` — current subscription, invoices, payment history, cancel button
- `/admin/payments` — admin-only dashboard: revenue, subs, recent activity

## Security notes

- Webhook signatures verified BEFORE payload parsing.
- Idempotency enforced at the DB level via UNIQUE `(provider, event_id)`.
- Duplicate checkout prevented by refusing when the user already has an
  active subscription on the same plan.
- All billing state changes recorded in `billing_audit_log`.
- Refunds and admin views require `role='admin'`.
- No real API keys are committed anywhere; all providers stay disabled until
  the env vars are set.
