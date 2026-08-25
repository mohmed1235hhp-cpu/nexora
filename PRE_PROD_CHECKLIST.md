# Pre-Production Checklist — Cyber AI Platform

Follow top-to-bottom. Every box below must be checked before flipping DNS
to production.

## 1. Secrets (REQUIRED)
- [ ] `MASTER_ENCRYPTION_KEY` — generate with `openssl rand -base64 32`
      (or run `./scripts/generate-secrets.sh`)
- [ ] `GROQ_API_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `REPLICATE_API_TOKEN`
- [ ] `TOGETHER_API_KEY`
- [ ] S3/R2 storage credentials:
      `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`,
      `STORAGE_BUCKET`, `STORAGE_ENDPOINT`, `STORAGE_REGION`

## 2. Hardening
- [ ] `COOKIE_SECURE=true`
- [ ] `ALLOWED_ORIGINS` = production domains only (no `localhost`)
- [ ] `COOKIE_DOMAIN` set to the apex prod domain (e.g. `.cyberai.example`)
- [ ] TLS enforced end-to-end (LB → app; Postgres `sslmode=require`)

## 3. Infrastructure
- [ ] `QUEUE_DRIVER=bullmq` (requires `REDIS_URL`, TLS-backed)
- [ ] `STORAGE_DRIVER=s3` **or** `r2` (never `local`/`memory` in prod)
- [ ] Postgres pool sized against `max_connections` (see `.env.production.example`)

## 4. Tests
- [ ] Run skipped integration suites once a real prod-like DB is linked:
      ```
      DATABASE_URL=<prod-like> pnpm --filter @cyberai/api-server test
      ```
- [ ] k6 load test at 1K / 10K VUs → `docs/load/`
- [ ] Restore-from-backup drill on staging

## 5. Observability
- [ ] `SENTRY_DSN` populated (server + `VITE_SENTRY_DSN` for the web app)
- [ ] `OTEL_EXPORTER_OTLP_ENDPOINT` pointed at the collector
- [ ] Grafana dashboards live: p95 latency, error rate, queue depth, worker saturation
- [ ] SLO alerts routed to on-call

## 6. CI / SecOps
- [ ] `pnpm audit --prod --audit-level=high` in CI
- [ ] Trivy container scan in CI
- [ ] `.github/dependabot.yml` (npm + docker)
- [ ] CodeQL / Semgrep enabled

## 7. Release
- [ ] Blue/Green or Canary strategy documented
- [ ] Rollback tested end-to-end
- [ ] Sentry release tracking enabled

> The env loader in `artifacts/api-server/src/lib/env.ts` now **fails fast**
> on startup if any item under sections 1–3 or 5 is missing when
> `NODE_ENV=production`. See `.env.production.example` for the full template.
