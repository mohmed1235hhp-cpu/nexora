# @workspace/deploy-platform

Internal Deployment Platform — **Phase 1 (scaffold)**.

Provides interface-driven building blocks for:

- Project Build Engine + Pipeline
- Build Queue (global / priority / premium / retry / delayed)
- Build Worker Pool (registry, scheduler, monitor, retry)
- Task Dispatcher
- Artifact Storage / Versioning / Cleanup
- Internal Project Hosting + URL Generator
- Preview System
- Server Manager (placeholder only — no real infra binding)
- Reports (build + deployment)
- Monitoring dashboard data source
- Timeline events

## Non-goals in Phase 1

- No real external service integration.
- No real server binding (Server Manager is placeholder).
- No UI (agents-ui integration deferred to Phase 2).
- No persistence (in-memory stores; DB adapter deferred to Phase 2).

## Phase 2

See [`PHASE_2.md`](./PHASE_2.md).
