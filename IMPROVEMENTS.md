# Improvements Applied — v5 (5-Star Push)

This document summarizes every change layered onto the v4 archive to bring the
project to a production-ready 5-star baseline.

## 1. Critical blockers fixed

- **Removed Replit-specific dependencies** from root and frontend
  (`@replit/connectors-sdk`, `@replit/vite-plugin-*`), plus the `@replit/*`
  entries in `pnpm-workspace.yaml`. The project is now portable to any
  Node.js host or Docker.
- **`vite.config.ts`** cleaned: no more `runtimeErrorOverlay`, no
  `cartographer`, no `devBanner`.
- **Generic Zod validation middleware** at
  `artifacts/api-server/src/middlewares/validate.ts` — every route can now
  validate `body` / `query` / `params` in one line with structured 400
  responses, no more hand-written `if (!field) return 400`.
- **Environment validation** (`lib/env.ts`) — fail-fast at boot; the process
  refuses to start with missing or malformed config.

## 2. Security hardening

- **Argon2id password hashing** (`lib/password.ts`) with tunable memory /
  iterations / parallelism. Legacy bcrypt hashes are verified and
  transparently re-hashed to Argon2 on next successful login.
- **Helmet** with strict Content Security Policy, `frame-ancestors 'none'`,
  `object-src 'none'`, HSTS in production.
- **CORS**: hard-deny cross-origin in production when `ALLOWED_ORIGINS` is
  unset (previously fell back to allow-all).
- **Cookie parsing** wired in (`cookie-parser`) as the substrate for the
  planned httpOnly session migration.
- **Correlation IDs** (`X-Request-ID`) generated per request, echoed back in
  responses and error payloads for log correlation.
- **Reduced JSON body limit** from 10 MB → 1 MB (fewer DoS vectors; big
  uploads should go through the media route with its own limits).
- **Trust proxy** enabled so `req.ip` and `Secure` cookies work correctly
  behind reverse proxies / load balancers.
- **Structured audit log** (`lib/audit.ts`) for auth, role changes, bans,
  deletions, and moderation actions.

## 3. Observability

- **`/api/readyz`** readiness probe that actually pings Postgres via
  `select 1`. `/api/healthz` remains as the lightweight liveness probe.
- **Correlation IDs** propagated through pino-http and included in error
  responses.
- **`SENTRY_DSN`** slot in env schema — wire the SDK when ready.

## 4. DevOps / packaging

- **Multi-stage `Dockerfile`** (Node 22 Alpine, non-root user, `HEALTHCHECK`,
  cached pnpm store via BuildKit).
- **`docker-compose.yml`** with Postgres 16, Redis 7, and the API service
  wired together with healthchecks.
- **`.dockerignore`** to keep image sizes lean.
- **GitHub Actions CI** (`.github/workflows/ci.yml`):
  `lint-typecheck` → `test` (against a live Postgres service container) →
  `build` → `docker` (on main only, with GHA layer cache).
- **`.env.example`** documents every supported variable.

## 5. Auth route refactor (reference implementation)

- `routes/auth.ts` fully rewritten to demonstrate the new pattern:
  - Body validated with Zod via `validate()` — no more scattered `if (!x)` checks
  - Passwords hashed with Argon2id; legacy bcrypt hashes migrated on next login
  - Every register / login / logout / password-change / failed-login emits an audit event
  - Timing-attack-resistant login (verifyPassword always runs, even when the user is missing)
  - Login accepts username OR email
  - Password change invalidates all sessions except the current one
- `lib/schemas/auth.ts` — reusable Zod schemas (also usable from the frontend for pre-validation)
- `tests/auth.integration.test.ts` — real supertest integration test running against the app

## 6. Documentation

- **`README.md`** rewritten with architecture, setup, security summary.
- **`SECURITY.md`** — reporting flow, controls in place, known gaps.
- **`CONTRIBUTING.md`** — PR checklist, coding conventions, schema/migration
  workflow.
- **This file** for change tracking.

## Next steps (roadmap to enterprise-grade)

- Migrate Bearer tokens → short-lived access token + rotating refresh token
  in httpOnly Secure SameSite cookies + CSRF double-submit.
- Redis-backed rate limiting keyed by user (not just IP) + brute-force
  lockout with exponential backoff.
- Cursor-based pagination applied uniformly to all list endpoints.
- Full OpenAPI coverage of all 28 route modules (currently only `/healthz`
  is specified) followed by Orval regeneration.
- Replace string-pattern tests with real Supertest integration tests
  running against Testcontainers Postgres.
- Realtime chat/notifications over WebSocket instead of polling.
- Full-text search via Postgres `tsvector` or Meilisearch.
- Sentry SDK wired for frontend + backend.
- Storybook for the shared UI kit.
