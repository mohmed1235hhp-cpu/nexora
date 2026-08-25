# Cyber AI — Enterprise Infrastructure

**Additive to the existing million-users upgrade (`UPGRADE_MILLION_USERS.md`).**
Nothing here removes, renames, or breaks a shipped feature. Every module is
opt-in via env vars — behavior with no config equals behavior before this pass.

---

## 1. New workspace packages

| Package | Purpose |
|---|---|
| `@workspace/queue`      | Unified queue façade. Drivers: `memory` (default), `bullmq` (Redis). Handles notifications, email, contests, image/video/app/site builds. |
| `@workspace/storage`    | Unified object storage. Drivers: `local`, `s3`, `r2`, `supabase`. |
| `@workspace/monitoring` | HealthRegistry + Prometheus metrics + error-event fan-out. |
| `@workspace/resilience` | `retry`, `timeout`, `CircuitBreaker`, `makeFailover`. |

Existing packages (`@workspace/cache`, `@workspace/cdn`, `@workspace/scalability`,
`@workspace/pagination`, `@workspace/observability`, `@workspace/media-*`) are
untouched.

---

## 2. Architecture at a glance

```text
                     ┌──────────────────────────────┐
                     │   Cloudflare / ALB / GCLB    │  (WAF, DDoS, TLS, CDN)
                     └──────────────┬───────────────┘
                                    │
                     ┌──────────────▼───────────────┐
                     │           Nginx              │  (rate-limit, LB, cache)
                     └──────────┬────────┬──────────┘
                                │        │
                 ┌──────────────▼┐     ┌─▼─────────────┐
                 │  API pod #1   │ ... │  API pod #N   │   (HPA 3–50 replicas)
                 │  stateless    │     │  stateless    │
                 └────┬────┬─────┘     └─────┬────┬────┘
                      │    │                 │    │
        ┌─────────────▼┐  ┌▼─────────────┐  ┌▼────▼──────┐
        │  PostgreSQL  │  │    Redis     │  │  Storage   │
        │  primary +   │  │  cache / RL  │  │  R2/S3/SB  │
        │  read replic │  │  BullMQ      │  └─────┬──────┘
        └──────────────┘  └──────┬───────┘        │
                                 │                │
                          ┌──────▼───────┐        │
                          │ Worker pods  │◄───────┘
                          │  (HPA 2–30)  │
                          └──────────────┘
```

Every arrow crossing a pod boundary is retryable, timed out, and observable.

---

## 3. Request lifecycle

1. Client → Cloudflare (WAF, bot mitigation, TLS, image/asset cache).
2. Cloudflare → Nginx (rate-limit, gzip/brotli, HSTS, per-IP conn-limit).
3. Nginx → API pod via `least_conn` upstream; `proxy_next_upstream` retries a
   different pod on 5xx/timeout — instant failover.
4. API pod:
   - Request-id from Nginx (`X-Request-Id`) flows through logs and metrics.
   - `@workspace/scalability` — rate-limit + idempotency + validation.
   - Business logic — data reads via `@workspace/cache.remember()` + cursor
     pagination via `@workspace/pagination`.
   - Heavy work enqueued via `@workspace/queue` → workers.
   - Storage via `@workspace/storage`, URLs rewritten by `@workspace/cdn`.
5. Response → gzip/brotli at Nginx → cached at Cloudflare when applicable.

---

## 4. Load-balancer readiness

The app runs unchanged behind any of:

- **Nginx** — `deploy/nginx/nginx.conf` (bundled).
- **Cloudflare** — `deploy/cloudflare/README.md`.
- **AWS ALB** — target group on `:3000`, health check `/api/healthz`, sticky
  sessions off (app is stateless), idle timeout 60s.
- **Google Cloud Load Balancer** — backend service on `:3000`, health check
  `/api/readyz`, session affinity NONE.

Requirements the app already satisfies:

- Stateless request handling (sessions in Postgres/Redis, never in memory).
- Trusts `X-Forwarded-For` / `X-Forwarded-Proto` when behind a proxy.
- Emits `X-Request-Id` if the LB didn't set one.
- Graceful shutdown on `SIGTERM` (`terminationGracePeriodSeconds=30`).

---

## 5. Redis readiness

`@workspace/cache` and `@workspace/queue` autoselect Redis when `REDIS_URL`
is set. Use-cases wired for Redis:

- Sessions (already hashed, index in migration `0004`).
- Response / query cache — `cache.remember(key, ttl, fn)`.
- Rate limiting — `cache.incrWithTtl` + `scalability.rateLimit()`.
- Idempotency keys — `idempotent()` helper.
- Trending / leaderboards — namespaced `nsKey("lb", …)`.
- BullMQ backing store for `@workspace/queue`.

Failure mode: connect failure logs a warning, falls back to in-memory LRU;
no request path 500s on a Redis outage.

---

## 6. Queue system

`@workspace/queue` job names owned:

| Queue | Producer | Consumer | Priority |
|---|---|---|---|
| `image`          | image gen API      | media-workers image | plan-tier |
| `video`          | video gen API      | media-workers video | plan-tier |
| `app-build`      | app-builder API    | app-builder worker  | plan-tier |
| `website-build`  | website-builder    | website worker      | plan-tier |
| `notifications`  | any service        | notifications worker| high      |
| `email`          | auth, contests     | email worker        | medium    |
| `contest`        | contest engine     | contest worker      | high      |
| `analytics`      | fire-and-forget    | analytics worker    | low       |

All queues share retry defaults: 5 attempts, exponential backoff, jitter,
dead-letter to stderr (adapters replace this for Sentry / DLQ topic).

---

## 7. Object storage & CDN

Storage keys stay canonical in the database. Reads pass through
`@workspace/cdn.toCdnUrl(key)` — switch CDN by changing `CDN_BASE_URL`.
Switch object stores by changing `STORAGE_DRIVER`:

```env
STORAGE_DRIVER=r2         # or s3 | supabase | local
STORAGE_BUCKET=cyberai-prod
STORAGE_ENDPOINT=https://<account>.r2.cloudflarestorage.com
STORAGE_PUBLIC_URL=https://cdn.cyberai.example
CDN_BASE_URL=https://cdn.cyberai.example
```

No application code path knows or cares which driver is active.

---

## 8. Monitoring

- **`GET /api/healthz`** — liveness (always 200 unless the process is dead).
- **`GET /api/readyz`**  — readiness (aggregates registered `HealthRegistry`
  checks: `db`, `redis`, `storage`, `queue`, upstream AI providers).
- **`GET /metrics`**     — OpenMetrics/Prometheus exposition.

Standard metrics emitted out of the box:

- `http_requests_total{method,route,status}`
- `http_duration_ms_bucket{method,route}`
- `http_errors_total{route}`
- `db_query_duration_ms_bucket{op}`
- `queue_depth{queue}`
- `queue_jobs_total{queue,outcome}`
- `ai_requests_total{provider,operation}`
- `ai_tokens_total{provider,model}`

Slow queries above `SLOW_QUERY_MS` go into `perf_slow_queries`
(added by migration `0004`). Error events fan out via `onError(fn)` to
Sentry / OTel adapters when configured.

---

## 9. Auto-recovery

`@workspace/resilience` covers three layers:

- **Retry** — `retry(fn, { attempts, baseMs, isRetryable })` — used on every
  outbound network call (AI providers, storage, Redis, downstream services).
- **Timeout** — `timeout(promise, ms, label)` — hard bound on every external
  call. Combined with retry: `retry(() => timeout(fn(), 10_000, "openai"))`.
- **Circuit breaker** — `CircuitBreaker` per upstream. Half-open probing
  restores service without flapping.
- **Failover** — `makeFailover([{name, provider}], invoke)` — walks a
  provider list, first healthy wins (e.g. Anthropic → Groq for chat).

Failed queue jobs auto-retry with exponential backoff + jitter; after
`attempts` are exhausted they land in the dead-letter path.

---

## 10. Database connection pool

Follow the sizing rule already in `docs/` and `.env.example`:

```env
# Recommended: (num_api_pods * PG_POOL_MAX) + (num_worker_pods * PG_POOL_MAX)
# should be less than 80% of postgres max_connections.
PG_POOL_MAX=10
PG_POOL_MIN=2
PG_IDLE_TIMEOUT_MS=30000
PG_CONNECTION_TIMEOUT_MS=5000
PG_STATEMENT_TIMEOUT_MS=15000
```

For fan-out beyond ~30 API pods, put PgBouncer (transaction mode) in front
of Postgres so each pod pools to PgBouncer instead of the database.

---

## 11. Security posture

- **Rate limiting** — three layers: Cloudflare (edge), Nginx (per-IP,
  burst-tolerant), app (`@workspace/scalability.rateLimit`, per-user + per-IP).
- **Bot protection** — Cloudflare Super Bot Fight Mode.
- **IP protection** — origin only accepts Cloudflare IP ranges.
- **Request validation** — Zod-based `@workspace/api-zod` on every route.
- **Audit logs** — existing `audit_logs` table (migration `0001`).
- **JWT validation** — `@workspace/scalability.verifyToken`
  (SHA-256 hash + `timingSafeEqual`).
- **Token hashing** — sessions and idempotency keys stored hashed.

---

## 12. Microservices readiness

Every domain already lives in its own workspace package with a typed
public interface. Extraction to a standalone service is a package move
plus a `Dockerfile`; the callers depend on the exported API surface,
not on internals. Domains ready to split now:

- `chat`, `community`, `ai-core`, `media-*`, `notifications`, `analytics`,
  `contest`.

The queue is the async spine between them. The Postgres schema is
already per-domain-scoped via table prefixes.

---

## 13. Horizontal scaling & failover

- API and worker pods are stateless — every replica interchangeable.
- HPAs scale on CPU + memory (see `deploy/k8s/api-deployment.yaml`).
- PDBs (`PodDisruptionBudget`) keep at least 2 API pods available during
  cluster maintenance.
- Nginx `proxy_next_upstream` retries the next pod on failure — zero
  perceived downtime when a single pod dies.
- Multi-AZ: run at least one replica per zone; Postgres uses a hot standby
  in a different AZ; Redis Sentinel or managed cluster (ElastiCache /
  Upstash / Memorystore).

---

## 14. Backup & recovery

`scripts/backup/` already ships a Postgres dump script. Recommended plan:

- **Postgres**: PITR via WAL archiving to object storage. Retention 30d.
  Managed Postgres (RDS / Cloud SQL / Neon) covers this natively.
- **Object storage**: enable versioning (S3 / R2 both support it) and
  cross-region replication for the primary bucket.
- **Redis**: AOF + RDB (already configured in Compose); Redis is a cache
  and can be rebuilt — no long-term retention required.
- **Recovery drill**: `scripts/backup/` includes `restore.sh` — run it
  against staging quarterly. RPO ≤ 5min, RTO ≤ 30min.

---

## 15. Deployment targets

| Target | Manifest / config |
|---|---|
| Docker           | `Dockerfile`                          |
| Docker Compose   | `docker-compose.yml` (dev), `docker-compose.prod.yml` |
| Kubernetes       | `deploy/k8s/*.yaml`                   |
| Railway          | Use `Dockerfile`, env from `.env.example` |
| Coolify          | Compose stack — point at `docker-compose.prod.yml` |
| AWS              | ECS/EKS from `Dockerfile`; ALB → API; RDS Postgres; ElastiCache Redis; S3 |
| Google Cloud     | GKE from k8s manifests; Cloud SQL; Memorystore; GCS |
| Azure            | AKS from k8s manifests; Azure DB for Postgres; Azure Cache for Redis; Blob |

The application never reads `AWS_REGION` / `GOOGLE_CLOUD_PROJECT` /
`RAILWAY_*` — it only reads generic env vars (`DATABASE_URL`, `REDIS_URL`,
`STORAGE_*`). Portable without conditionals.

---

## 16. Performance targets & how we hit them

| Target | How |
|---|---|
| p95 < 200ms most endpoints | Cache-first reads, indexed queries (migration `0004`), no N+1 (loaders exist per package) |
| Thousands concurrent req | Stateless pods + HPA + Nginx keep-alive pool + PgBouncer |
| Low memory | Streaming responses, cursor pagination, LRU cache bounds |
| Low CPU | Cached hot paths, cheap Redis `INCR` for rate-limits, no per-request JIT compile |

---

## 17. Testing

- Unit — vitest across packages (`pnpm -r test`).
- Load / stress / recovery — `tests/load/k6-smoke.js` (see `tests/load/README.md`).
- Contract — `tests/contract/` (existing, unchanged).
- Integration — `tests/integration/` (existing).
- E2E — `tests/e2e/` (existing).
- Security — `SECURITY.md` outlines the threat model and disclosure path.

---

## 18. Environment reference

Additions to `.env.example` are appended, never renamed:

```env
# Queue driver — memory | bullmq
QUEUE_DRIVER=memory

# Storage driver — local | s3 | r2 | supabase
STORAGE_DRIVER=local
STORAGE_BUCKET=
STORAGE_REGION=auto
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=

# Connection pool
PG_POOL_MAX=10
PG_POOL_MIN=2
PG_IDLE_TIMEOUT_MS=30000
PG_CONNECTION_TIMEOUT_MS=5000
PG_STATEMENT_TIMEOUT_MS=15000
```
