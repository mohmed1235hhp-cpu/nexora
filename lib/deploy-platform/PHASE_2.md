# Phase 2 Plan — Deployment Platform

Phase 1 delivers a modular, interface-driven scaffold with in-memory
implementations, timeline events, reports, and a Server Manager
placeholder. Phase 2 wires it into the rest of the platform and hardens
it for production.

## 1. Real Multi-Agent + AI Router integration
- Bridge `@workspace/agents` orchestrator into `BuildPipeline` stages
  (analyze / review / fix-errors / test) via injected agent handles.
- Route stage decisions through the existing AI Router; do not fork it.
- Expose a `BuildAgentAdapter` implementing `IStageExecutor`.

## 2. Persistence
- Move `BuildHistory`, `DeploymentHistory`, `ArtifactStore`,
  `ProjectRegistry`, and `LogStore` from in-memory to
  `@workspace/db` (Drizzle) via repository interfaces already defined
  in Phase 1 (`IArtifactStore`, `IProjectRegistry`, ...).
- Add migrations under `lib/db/migrations/deploy_platform/*`.

## 3. Real Workers
- Replace the in-process worker with a process/worker-thread pool.
- Add a Redis/Postgres-backed queue driver behind `IQueue`.
- Wire `WorkerScheduler` to a real dispatcher with backpressure.

## 4. Real Hosting Layer
- Wire `HostingService` to a static file server + reverse proxy.
- Implement domain + SSL providers behind the existing placeholders.
- Add per-project isolation (chroot / container) behind `IIsolation`.

## 5. Server Manager binding
- Implement `IServerProvider` for a first real backend (bare metal,
  VPS pool, or container platform) without changing the interfaces.
- Add real HealthMonitor probes, AutoScaler policy engine, and
  LoadBalancer routing.

## 6. Incremental + parallel builds
- Turn `IncrementalBuildCache` into a content-hash cache with reuse.
- Enable parallel stage execution where the DAG allows.

## 7. UI
- Add a Deployments dashboard in `lib/agents-ui` bound to
  `MonitoringDashboard` + `TimelineStream`.
- Live logs via SSE from `LogStore`.

## 8. Security hardening
- Real artifact signature validation.
- Per-project permission tokens (already stubbed).
- Sandbox execution for `TestRunner` and `Compiler`.

## 9. Additional project types
- Promote Vue / Angular / Flutter from placeholder to first-class.
- Add project-type auto-detection.

## 10. Observability
- Emit OpenTelemetry spans from every pipeline stage.
- Export queue/worker metrics to Prometheus format.
