/** Lazy backend Sentry — active only when SENTRY_DSN set. */
export async function initSentry() {
  if (!process.env.SENTRY_DSN) return;
  const S = /* @ts-expect-error optional runtime dep */
  (await import("@sentry/node"));
  S.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1, environment: process.env.NODE_ENV });
  return S;
}
