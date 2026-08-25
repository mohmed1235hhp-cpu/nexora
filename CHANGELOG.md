# Changelog

All notable changes to this project are documented here.

## [Unreleased] — merge of app-builder

### Added
- New workspace package `@workspace/app-builder` (`lib/app-builder`) containing the full AI-driven app generator (agents, generators, pipeline, review, security, perf, reports, templates, scaffolds).
- `MERGE_REPORT.md` documenting the merge decisions and every fix applied.
- Missing barrel `index.ts` files across `agents`, `generators`, `pipeline`, `review`, `templates`, `scaffolds`, `security`, `perf`, `reports`, `tests-gen`.

### Fixed
- **security/rules/**: rewrote all five rules (`no-eval`, `no-hardcoded-secret`, `no-dangerous-html`, `no-http`, `no-localStorage-token`) — they previously carried a copy-paste stub with dead `if (kind === …)` branches so only the branch matching the filename could ever fire, and it always emitted the wrong rule name/message.
- **review/rules/**: same class of bug in all ten review rules; each rule now performs one focused check with an accurate message. `balanced-braces` is now a real brace-depth walker.
- **perf/checks/**: same class of bug in all five perf checks; each function now runs a single, correctly-named check.

## [0.5.0] — 2026-07 — "Five-Star Push"

### Added
- Argon2id password hashing with transparent bcrypt→Argon2 migration
  (`lib/password.ts`).
- Generic Zod validation middleware (`middlewares/validate.ts`) applied to
  the auth routes as a reference implementation.
- Structured audit log with typed actions (`lib/audit.ts`).
- Environment validation with fail-fast startup (`lib/env.ts`).
- `/api/readyz` readiness probe that pings Postgres.
- Helmet with strict CSP, `frame-ancestors 'none'`, `object-src 'none'`,
  HSTS in production.
- Request correlation IDs propagated through pino logs and error responses.
- Cookie parsing wired in as substrate for the planned httpOnly session
  migration.
- Multi-stage `Dockerfile` (Node 22 Alpine, non-root, HEALTHCHECK).
- `docker-compose.yml` with Postgres 16 + Redis 7 + healthchecks.
- GitHub Actions CI: typecheck → test (against real Postgres) → build →
  docker image (main only, with GHA cache).
- Full README, SECURITY, CONTRIBUTING, IMPROVEMENTS docs.
- ADRs for Argon2 (0001) and the planned cookie migration (0002).
- Real supertest integration test for the auth flow.
- Expanded OpenAPI (12 endpoints, standard error responses, cursor
  pagination pattern).

### Changed
- Auth routes now use Zod validation via `validate()` middleware instead of
  hand-written `if (!field)` checks.
- Login accepts either email or username (`or(...)` predicate).
- JSON body limit tightened from 10 MB → 1 MB.
- Trust proxy enabled so `req.ip` and Secure cookies work behind reverse
  proxies.
- CORS hard-denies cross-origin in production when `ALLOWED_ORIGINS` is
  unset (was allow-all).

### Removed
- `@replit/connectors-sdk` and the three `@replit/vite-plugin-*` packages.
- `@replit/*` catalog entries and exclusion list in `pnpm-workspace.yaml`.
- Hard-coded Replit-specific plugin loading in `vite.config.ts`.
- Legacy hard-coded bcrypt "dummy hash" (replaced by a runtime Argon2
  dummy hash generated once at boot).

### Security
- Argon2id (OWASP 2024) replaces bcrypt as default.
- CSP + HSTS + frame-ancestors 'none'.
- Rate-limited login now emits `auth.login_failed` audit events on every
  failure (including nonexistent users).
- Password change invalidates all other sessions for the user.

## [0.4.0] — prior
- Initial v4 baseline (before this change set).
