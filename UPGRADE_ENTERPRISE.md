# Cyber AI — Enterprise Infrastructure Upgrade (additive pass)

**Rule respected:** additive only. No existing file modified in-place, no
UI touched, no feature removed, no schema column dropped or renamed, no
public API broken, current architecture preserved.

Complete architecture, ops playbook, and env reference: **`docs/INFRASTRUCTURE.md`** and **`docs/RUNBOOK.md`**.

## Files added

### New workspace packages (each with its own `package.json` + `tsconfig.json`)

- `lib/queue/`      — unified job queue (memory | BullMQ).
- `lib/storage/`    — unified object storage (local | s3 | r2 | supabase).
- `lib/monitoring/` — HealthRegistry, Prometheus metrics, error fan-out.
- `lib/resilience/` — retry / timeout / circuit breaker / failover.

### Deployment manifests

- `deploy/nginx/nginx.conf`, `deploy/nginx/proxy_common.conf`
- `deploy/k8s/namespace.yaml`
- `deploy/k8s/config.yaml`
- `deploy/k8s/api-deployment.yaml` (Deployment + Service + HPA + PDB)
- `deploy/k8s/worker-deployment.yaml` (Deployment + HPA)
- `deploy/k8s/ingress.yaml`
- `deploy/cloudflare/README.md`
- `docker-compose.prod.yml`

### Tests & docs

- `tests/load/k6-smoke.js`, `tests/load/README.md`
- `docs/INFRASTRUCTURE.md`
- `docs/RUNBOOK.md`
- `UPGRADE_ENTERPRISE.md` (this file)

## Requirement → module map

| Requirement (brief) | Where |
|---|---|
| Service isolation, low coupling, horizontal scaling | Existing per-package workspace layout, preserved. K8s HPA in `deploy/k8s/`. |
| Pagination / cursor pagination / lazy load | Existing `@workspace/pagination` (migration `0004` cursors). |
| Response compression, cache headers | `deploy/nginx/nginx.conf` (gzip, `Cache-Control`), Cloudflare rules. |
| Retry / timeout | `@workspace/resilience.retry`, `.timeout`. |
| Load balancer ready (Nginx, Cloudflare, ALB, GCLB) | `deploy/nginx/`, `deploy/cloudflare/`, stateless app, `X-Forwarded-*` aware. |
| Redis ready | `@workspace/cache` (existing) + `@workspace/queue` BullMQ driver. Enable via `REDIS_URL`. |
| Queue system for heavy ops | `@workspace/queue` — queues: `image`, `video`, `app-build`, `website-build`, `notifications`, `email`, `contest`, `analytics`. |
| CDN ready | Existing `@workspace/cdn` + `deploy/cloudflare/README.md`. |
| Object storage (R2 / S3 / Supabase) | `@workspace/storage`. Driver via `STORAGE_DRIVER`. |
| Monitoring (health, metrics, errors, slow queries, AI usage) | `@workspace/monitoring` + existing `perf_slow_queries`, `ai_usage_logs`. |
| Auto recovery | `@workspace/resilience` retry + CircuitBreaker + failover; queue exponential retry; `proxy_next_upstream` at nginx. |
| DB connection pool | `docs/INFRASTRUCTURE.md` §10 + `.env.example` `PG_POOL_*`. |
| Rate limiting / bot / request validation / audit / JWT / hashing | Cloudflare rules + nginx `limit_req` + existing `@workspace/scalability` + `audit_logs`. |
| Microservices ready | Package boundaries + queue spine (§12 of `INFRASTRUCTURE.md`). |
| Horizontal scaling + failover | K8s HPA + PDB + Nginx `proxy_next_upstream`. |
| Backup + recovery | Existing `scripts/backup/` + `INFRASTRUCTURE.md` §14 + `RUNBOOK.md`. |
| Deployment (Docker, Compose, K8s, Railway, Coolify, AWS, GCP, Azure) | `Dockerfile` (existing), Compose files, `deploy/k8s/`, `INFRASTRUCTURE.md` §15. |
| Performance targets | `INFRASTRUCTURE.md` §16 (p95 <200ms, Nginx keep-alive, cache-first, cursor pagination). |
| Testing (load, stress, perf, security, recovery) | `tests/load/` + existing `tests/{contract,integration,e2e}`. |
| Documentation | `docs/INFRASTRUCTURE.md`, `docs/RUNBOOK.md`. |

## Verification

- No file in the previous archive was modified.
- Every new module compiles standalone (`tsc --noEmit` per package).
- Every new module has zero runtime dependencies at import time — optional
  peers (`bullmq`, `ioredis`, `@aws-sdk/*`, `@supabase/supabase-js`) are
  loaded via `await import(...)` only when the corresponding driver is
  selected. Installing them is not required to run the app with defaults.
- No env var was renamed. All new env vars have safe defaults (in-memory
  queue, local disk storage) so the project boots unchanged.
