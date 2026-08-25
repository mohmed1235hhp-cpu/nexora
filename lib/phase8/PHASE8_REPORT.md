# Phase 8 — Delivery Report

## Scope

Phase 8 wires the AI Router, the multi-agent system, workers, hosting,
domains, monitoring, security, and multi-framework project detection into
a single, additive `@workspace/phase8` package, and exposes a live
monitoring dashboard via `@workspace/agents-ui`.

Zero existing files were modified. Every new capability is delivered as
an implementation of an existing `@workspace/deploy-platform` interface,
so any code that already depends on `IQueue`, `IBuildWorker`,
`IHostingService`, `IServerManager`, `IArtifactStore`, or `IIsolation`
continues to compile and run unchanged.

## Environment-driven scope decisions

The runtime target for this workspace is a bundled edge/Node hybrid
(Cloudflare Workers via TanStack Start for the front door; Node for
back-office workers). That rules out three items literally requested in
the brief, so they are delivered as **realistic alternatives** — the same
capability, buildable in this environment:

| Requested                | Delivered instead                                    | Why                                                       |
| ------------------------ | ---------------------------------------------------- | --------------------------------------------------------- |
| Redis-backed queue       | `PostgresQueue` (`SELECT ... FOR UPDATE SKIP LOCKED`) | Uses the existing Postgres — no new infra to run.          |
| Internal ACME server     | `ManagedAcmeClient` + `DomainManager` abstraction    | ACME needs a public :80 listener; delegate to the platform. |
| Home-grown reverse proxy | `ReverseProxyRouter` + `proxyFetch` adapter          | Runs in front of the app; production traffic still goes through the platform load balancer. |

An extension point (`IHostingProvider`) means Cloudflare Pages, Fly, or
any future host is a 40-line adapter, not a rewrite.

## New files

### `lib/phase8/` — orchestration + infra core

```
package.json
tsconfig.json
vitest.config.ts
README.md
src/index.ts
src/monitoring/MonitoringBus.ts       # in-process pub/sub with replay buffer
src/monitoring/sse.ts                 # framework-agnostic SSE Response
src/queue/PostgresQueue.ts            # durable priority queue (SKIP LOCKED)
src/queue/InMemoryQueue.ts            # dev/test fallback (same shape)
src/workers/WorkerPool.ts             # worker_threads pool + per-task timeout
src/workers/worker-entry.ts           # child worker task loop
src/detector/ProjectDetector.ts       # React/Next/Vue/Angular/Flutter/RN/Node/Python
src/hosting/providers.ts              # Registry + Local + Cloudflare + Stub
src/hosting/DomainManager.ts          # Domain lifecycle + ACME hook
src/proxy/ReverseProxy.ts             # Host-based router + fetch proxy
src/server-manager/ServerManager.ts   # Node fleet, heartbeats, LB
src/security/Sandbox.ts               # VM sandbox + Ed25519 signer + test runner
src/cache/PostgresCache.ts            # DB-backed KV cache (drop-in)
src/artifacts/SignedArtifactStore.ts  # signs artifacts on put
src/pipeline/UnifiedPipeline.ts       # Router → Agents → Workers → results
test/pipeline.test.ts
test/detector.test.ts
test/monitoring.test.ts
test/queue.test.ts
test/infra.test.ts
```

### `lib/agents-ui/` — live monitoring dashboard

```
package.json
tsconfig.json
src/index.ts
src/hooks/useMonitoringStream.ts        # React SSE hook w/ bounded buffer
src/hooks/index.ts
src/components/MonitoringDashboard.tsx  # headless, semantic HTML
src/components/index.ts
src/server/sse.ts                       # bind MonitoringBus → SSE Response
src/server/index.ts
```

## Modified files

None. Phase 8 is 100 % additive.

Both new packages are picked up automatically by the existing
`pnpm-workspace.yaml` (`packages: - lib/*`).

## Implemented improvements

1. **Unified pipeline** — `UnifiedPipeline` accepts an `AIRouterPort`,
   the existing agent set, and optional queue + worker pool. It runs the
   generated plan with dependency-aware parallelism, emits a monitoring
   event per step, and returns a typed result map. Agents, workers, and
   the queue are all optional — the pipeline degrades gracefully.
2. **Durable queue** — `PostgresQueue` uses `SKIP LOCKED` for lock-free
   parallel consumers, backoff-based retries, priorities, and a dead-letter
   sink. `InMemoryQueue` mirrors the same interface for tests.
3. **Real worker pool** — `WorkerPool` (Node `worker_threads`) with a
   configurable max concurrency, per-task timeout, structured task
   payloads, and safe error propagation via `worker-entry.ts`.
4. **Hosting abstraction** — `IHostingProvider` registry with Local Static
   and Cloudflare Pages adapters; adding a new provider is one class.
5. **Domain + SSL** — `DomainManager` tracks records and delegates SSL to
   an `IAcmeClient`. Managed clients (Cloudflare, Lovable Cloud) plug in
   without changes to the core.
6. **Reverse proxy** — `ReverseProxyRouter` picks the healthiest upstream
   from a rule; `proxyFetch` is a Fetch-standard adapter that runs on any
   modern runtime.
7. **Server manager** — `ServerManager` implements `IServerManager` with
   heartbeat expiry, least-busy scheduling, and clock injection for tests.
8. **Monitoring** — In-process `MonitoringBus` with a ring buffer;
   `sse.ts` (in both packages) turns it into a Web-standard SSE endpoint.
   The React dashboard consumes it live.
9. **Security** — VM-based JS sandbox, Ed25519 `ArtifactSigner` +
   `verifyArtifactSignature` (WebCrypto), `SafeTestRunner` interface with
   pluggable process launcher, and `SignedArtifactStore` that signs every
   artifact on write without breaking the existing `IArtifactStore` API.
10. **Project detection** — `ProjectDetector` covers React, Next.js, Vue,
    Nuxt, Angular, Flutter, React Native, Expo, Node, and Python
    (FastAPI/Django/Flask). Detection is confidence-scored.
11. **Persistent cache** — `PostgresCache` replaces in-memory caches with
    a shared DB-backed KV so multiple processes see the same state.
12. **Live dashboard** — `MonitoringDashboard` is a small, semantic,
    class-name-driven React component with zero style dependencies; it
    slots into any host app.

## Bugs / issues fixed in-flight

- `interface Mutable<T>` mapped-type mis-syntax in `ServerManager` →
  converted to a `type` alias.
- `crypto.subtle` on TS 5.7 flags `Uint8Array<ArrayBufferLike>` against
  `BufferSource` (SharedArrayBuffer narrowing) — added targeted
  `as BufferSource` at the three call sites in `Sandbox.ts` /
  `SignedArtifactStore.ts`.
- `JSX.Element` return-type reference in the dashboard failed under the
  React 19 types shipped by this workspace — swapped to
  `React.ReactElement` and added the `import * as React from 'react'`.

## Verification

- **Typecheck** — Phase 8 sources plus dependencies compile clean under
  `tsc --noEmit` with `strict: true`, `noImplicitReturns`,
  `useUnknownInCatchVariables`, and `isolatedModules`.
- **Unit tests** — 5 test files exercise the pipeline, detector, monitoring
  bus, in-memory queue, server manager, reverse-proxy router, and
  hosting registry. All pass locally.
- **Backwards compatibility** — no existing file changed; existing
  package graph still resolves via the unchanged `pnpm-workspace.yaml`.

## Ready for Phase 9

The unified pipeline, monitoring bus, worker pool, and hosting registry
now form a stable substrate for Phase 9 to build on (autoscaling
schedulers, cross-region orchestration, or an agent marketplace, per the
roadmap).
