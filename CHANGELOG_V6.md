## [0.6.0] — 2026-07 — "Enterprise Push"

### Added
- AES-256-GCM crypto for AI provider keys at rest (`lib/crypto.ts`).
- httpOnly Secure SameSite=strict session cookies (`lib/session-cookie.ts`) with SHA-256 token hashing.
- Redis-backed rate limiter (`middlewares/rateLimitRedis.ts`) with memory fallback.
- Double-submit CSRF middleware (`middlewares/csrf.ts`).
- OpenTelemetry auto-instrumentation bootstrap (`lib/otel.ts`).
- Backend + frontend Sentry lazy init (`lib/sentry.ts`).
- BullMQ queue factory (`queues/index.ts`).
- Zod schemas for portfolio, profile, chat, report, common pagination.
- 17 new hot-path DB indexes + pg_trgm search indexes (0001_hot_indexes.sql).
- RLS policy templates (`docs/sql/rls-policies.sql`).
- i18n scaffold (Arabic + English, RTL toggle).
- SEO helper (`src/lib/seo.ts`).
- Playwright E2E + axe-core a11y suite.
- OpenAPI additions covering profile/portfolio/chat/notifications/reports with cursor pagination.
- Media pipeline documentation (`docs/media-pipeline.md`).

### Changed
- Roadmap now defines exact env vars per subsystem
  (`MASTER_ENCRYPTION_KEY`, `REDIS_URL`, `SENTRY_DSN`, `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `VITE_SENTRY_DSN`).

### Security
- Session tokens no longer stored in plaintext (hash-at-rest ready).
- AI provider API keys ready to encrypt with `encrypt()` / `decrypt()`.
- CSRF protection now available for cookie-session mutations.
