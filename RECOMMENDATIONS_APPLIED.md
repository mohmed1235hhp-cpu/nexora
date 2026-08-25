# Recommendations Applied — 2026-07-14

This snapshot applies the pre-launch checklist and audits the codebase.

## 1. Secrets & production env
- Added `.env.production.example` — complete template with every required prod variable.
- Added `scripts/generate-secrets.sh` — one-shot generator for
  `MASTER_ENCRYPTION_KEY`, `SESSION_SECRET`, `JWT_SECRET`
  (uses `openssl rand -base64`).
- **Hardened `artifacts/api-server/src/lib/env.ts`**: when `NODE_ENV=production`
  the loader now **fails fast** if any of the following is missing/wrong:
  - `MASTER_ENCRYPTION_KEY` (base64, 32 bytes)
  - `COOKIE_SECURE=true`
  - `ALLOWED_ORIGINS` (comma-list of `https://` production origins, no
    localhost / 127.0.0.1)
  - `QUEUE_DRIVER=bullmq` with `REDIS_URL` set
  - `STORAGE_DRIVER` in `{s3, r2, supabase}` (never `local`)
  - `SENTRY_DSN`
  - `OTEL_EXPORTER_OTLP_ENDPOINT`
- Schema now also validates the previously-missing keys: `QUEUE_DRIVER`,
  `STORAGE_DRIVER`, `STORAGE_*`, `CDN_BASE_URL`, `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `VITE_SENTRY_DSN`, `MASTER_ENCRYPTION_KEY`, `PG_POOL_*`.

## 2. Bug fixes discovered during review
- **`artifacts/api-server/src/routes/media.ts`** — was reading a non-existent
  `CDN_URL`; the rest of the codebase (and `.env.example`) uses `CDN_BASE_URL`.
  Fixed both call sites, so the media route's `cdnEnabled`/`cdnUrl` fields
  now actually reflect the configured CDN.

## 3. Updated `PRE_PROD_CHECKLIST.md`
Rewritten as an execution checklist grouped by:
Secrets → Hardening → Infra → Tests → Observability → CI/SecOps → Release.

## 4. Skipped integration tests
`artifacts/api-server/src/tests/auth.integration.test.ts` uses
`describe.skipIf(!process.env.DATABASE_URL)`, so pointing at a real DB is
all that's needed:

```bash
DATABASE_URL=postgres://... pnpm --filter @cyberai/api-server test
```

## 5. Sanity findings (no regression, listed for follow-up)
- 23 direct `process.env.*` reads outside `env.ts` — enumerated in the old
  checklist; low priority, but should be routed through `env` for
  fail-fast coverage.
- `lib/media-workers/src/workers/*.worker.ts` use `console.log` for
  readiness lines — replace with the platform logger when convenient.
- `tests/integration`, `tests/contract`, `tests/e2e` directories are empty
  at the repo root — real suites live under `lib/*/src/tests/`. Consider
  removing the empty top-level dirs or moving suites up.
