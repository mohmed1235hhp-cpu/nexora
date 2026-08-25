# @workspace/phase8

Phase 8 — unified AI/Agents pipeline, durable queue, real worker pool,
hosting provider abstraction, server manager, monitoring bus with SSE,
project detector, artifact signing and JS sandbox.

## Modules

| Module                                | Purpose                                                    |
| ------------------------------------- | ---------------------------------------------------------- |
| `pipeline/UnifiedPipeline`            | AI Router → Agents → Workers/Queue → results               |
| `queue/PostgresQueue` + `InMemoryQueue` | Durable priority queue with retry/backoff/dead-letter    |
| `workers/WorkerPool`                  | Node `worker_threads` pool with per-task timeout           |
| `hosting/*`                           | Provider registry, local static, Cloudflare Pages, stub    |
| `hosting/DomainManager`               | Domain registration + pluggable ACME client                |
| `server-manager/ServerManager`        | Node fleet, heartbeats, round-robin/least-busy scheduling  |
| `proxy/ReverseProxy`                  | Host-based router + fetch-based proxy adapter              |
| `detector/ProjectDetector`            | React/Next/Vue/Angular/Flutter/RN/Node/Python detection    |
| `monitoring/MonitoringBus` + SSE      | In-process events + Server-Sent Events endpoint            |
| `security/Sandbox`                    | JS VM sandbox, Ed25519 artifact signer, safe test-runner   |
| `cache/PostgresCache`                 | DB-backed KV cache (drop-in for in-memory caches)          |
| `artifacts/SignedArtifactStore`       | `IArtifactStore` wrapper that signs every artifact         |

## Zero-breakage guarantee

Every existing interface (`IQueue`, `IBuildWorker`, `IHostingService`,
`IServerManager`, `IArtifactStore`, `IIsolation`) is implemented — no
existing file is modified. Extended capabilities are additive.

## Runtime notes

- `WorkerPool` needs Node ≥ 18 (worker_threads).
- `PostgresQueue` / `PostgresCache` need a `pg.Pool`-shaped client (any
  Postgres driver).
- Web-standards Response/Request/fetch used everywhere else, so the
  same code runs on Node, Deno, Bun, and Cloudflare Workers.
