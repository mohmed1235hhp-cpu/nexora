# Final Pre-Launch Audit — Cyber AI Platform

**Date:** 2026-07-14  
**Scope:** Full monorepo (`artifacts/*`, `lib/*`, `scripts`), 4.5 MB source.

## Verdict

**Ready to launch after completing sections 1–3 of `PRE_PROD_CHECKLIST.md`
(prod secrets + `.env.production.example` values).** Code quality is
production-grade; no blocking security or correctness bugs found in this
review. Findings below are ordered by severity.

---

## 🔴 Blockers — none

No unpatched vulnerabilities, no leaked secrets, no obviously unsafe SQL,
no `eval` / `new Function`, no client-side use of service keys.

## 🟠 Fixed in this pass

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `artifacts/api-server/src/lib/env.ts` | `NODE_ENV=production` did not enforce the security-critical secrets/drivers. | Added `superRefine` that fails fast on missing `MASTER_ENCRYPTION_KEY`, non-secure cookies, localhost origins, memory queue/storage, and missing Sentry/OTEL. |
| 2 | `artifacts/api-server/src/routes/media.ts` | Read a non-existent `CDN_URL`; rest of the codebase uses `CDN_BASE_URL`. | Renamed both call sites → `CDN_BASE_URL`. |
| 3 | `artifacts/api-server/src/index.ts` | No SIGTERM/SIGINT handling → k8s rolling deploys would drop in-flight requests. No `unhandledRejection` / `uncaughtException` guards. | Added drain-on-signal (`server.close`, 15 s grace) plus crash guards that log through pino before exiting. |
| 4 | `artifacts/api-server/src/queues/index.ts` | Every `makeQueue()` call opened a new `IORedis` connection, and `QUEUE_DRIVER` was ignored. | Rewrote with a memoized Redis connection, per-queue cache, and a memory driver stub so dev/CI stays offline. Added `closeAllQueues()` for shutdown hooks. |
| 5 | `.env.production.example` (new) | No prod template existed. | Full template covering runtime, DB, auth, cookies, secrets, AI keys, `QUEUE_DRIVER=bullmq`, `STORAGE_DRIVER=s3`, Sentry, OTEL, pool. |
| 6 | `scripts/generate-secrets.sh` (new) | Manual secret minting was error-prone. | One-shot generator using `openssl rand -base64`. |
| 7 | `PRE_PROD_CHECKLIST.md` | Old checklist mixed launch-blockers with nice-to-haves. | Rewritten as a strict execution sequence. |

## 🟡 Findings verified as **safe** (no change needed)

- **SQL construction** — every `sql\`...\`` template uses drizzle column
  identifiers, not string interpolation of user input. Parameter binding is
  intact everywhere (`groups`, `feed`, `contests`, `analytics`, etc.).
- **AuthN / session** — session tokens stored as SHA-256 (not raw); Argon2id
  hashing with configurable cost; bcrypt legacy hashes auto-rotate on
  successful login; constant-time verification via `timingSafeEqual` and a
  dummy Argon2 hash to defeat user-enumeration timing.
- **CSRF** — double-submit cookie on unsafe methods, correctly skipped for
  Bearer clients and pre-session endpoints. Cookie is `SameSite=Strict`,
  `Secure` in prod.
- **CORS / Helmet** — CSP locked to `'self'` with narrow allow-lists;
  `frame-ancestors 'none'`; HSTS with preload in prod; explicit hard-deny
  when no `ALLOWED_ORIGINS` is configured in prod.
- **Rate limiter** — Redis-backed sliding window; graceful in-memory
  fallback logged, not silent.
- **Crypto** — AES-256-GCM envelope encryption with authenticated tag; key
  material only ever loaded from env, cached after first use, and validated
  at boot.
- **Supply chain** — `pnpm-workspace.yaml` enforces a 1-day
  `minimumReleaseAge` on all packages, blocking hot-off-the-press malicious
  releases.

## 🟢 Follow-ups (post-launch, not blocking)

1. Route the remaining 12 direct `process.env.*` reads through `env.ts`
   (list in the sanity section of `RECOMMENDATIONS_APPLIED.md`).
2. Replace `console.log("[worker] … ready")` in
   `lib/media-workers/src/workers/*.worker.ts` with the platform logger.
3. Trim the 48 `: any` / `as any` occurrences flagged by the audit script;
   OWASP top-hits first (`routes/ai.ts`, `routes/media.ts`).
4. Remove the empty root-level `tests/{integration,contract,e2e}`
   directories or move suites up from `lib/*/src/tests/`.
5. Enable CI gates: `pnpm audit --prod --audit-level=high`, Trivy image
   scan, CodeQL/Semgrep, dependabot.

## How to launch

```bash
# 1. Generate secrets
./scripts/generate-secrets.sh > .env.secrets   # keep OUT of git

# 2. Fill in .env.production.example values in your secret manager
#    (Doppler / AWS Secrets Manager / Vault / k8s Secret).

# 3. Boot with production env — env.ts will fail fast on anything missing.
NODE_ENV=production pnpm --filter @cyberai/api-server start

# 4. Run integration tests against the linked DB
DATABASE_URL=postgres://... pnpm --filter @cyberai/api-server test
```

If the loader logs `[env] invalid or missing environment variables: …`
that list IS the launch blocker list — fix and retry.
