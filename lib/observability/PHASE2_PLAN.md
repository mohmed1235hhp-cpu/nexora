# Phase 2 — Plan

Phase 2 layers on top of Phase 1 without changing any Phase 1 public API.

## Deliverables

### Security platform
- `SecurityManager` orchestrator.
- `ThreatDetector` (rule-based + rate-anomaly).
- `PermissionValidator` (RBAC + resource ACL).
- `InputValidator` (zod schema wrapper + coerce/sanitize).
- `RateLimiter` (token bucket + sliding window, per-key).
- `ApiProtection` (auth guard, replay protection, size limits).
- `RequestValidator` (schema + signature).
- `SecretsManager` provider interface (in-memory + env-backed impls).
- `EnvironmentValidator` (start-up checks).

### Performance platform
- `PerformanceManager`, `MemoryOptimizer`, `CpuOptimizer`,
  `BundleOptimizer`, `QueryOptimizer`, `LazyLoader`, `CachingLayer`
  (LRU + TTL + stampede protection), `CompressionLayer` (gzip/br).

### Analytics
- `UsageAnalytics`, `AiAnalytics`, `ProjectsAnalytics`,
  `PerformanceAnalytics`, `UserAnalytics`, `CreditsAnalytics`,
  `BuildAnalytics`. All backed by pluggable `AnalyticsSink`.

### Alerts
- `AlertManager`, alert channels (log / event-bus / webhook interface).
- Alert types: Critical, Performance, Security, Worker, Queue.
- Alert rules bound to `Metric` + `HealthSnapshot`.

### Auto-Recovery (placeholders + strategies)
- `RestartFailedWorker`, `RetryFailedTasks`, `ClearQueue`, `RecoverServices`
  as `RecoveryStrategy` implementations behind a `RecoveryOrchestrator`.

### Reports
- Daily / Weekly / Monthly / Performance / Security / Usage / AI reports.
- `ReportGenerator` reads Analytics + Metrics + Audit log, emits Markdown +
  JSON artifacts.

### Dashboards UI
- Add TanStack Start routes under `artifacts/api-server` (or a new
  `artifacts/observability-ui` app):
  - `/observability` (System)
  - `/observability/performance`
  - `/observability/security`
  - `/observability/analytics`
  - `/observability/ai`
  - `/observability/build`
- Each route consumes the Phase 1 `SystemDashboard` data + new Phase 2 data.

### Timeline UX
- `IncidentTimeline` state machine emitting:
  🔍 Detect → 📊 Analyse → 🛡 Security scan → 🧠 Root cause →
  🛠 Auto-remediate → 📄 Report.

### Testing
- Performance tests (histogram thresholds).
- Security tests (permission + rate limit + input validation).
- Monitoring tests (bus + registry).
- Analytics tests (aggregation correctness).
- Health tests extended for cascading failures.
- Stress tests (queue + worker saturation).

### Documentation
- `docs/observability/monitoring-architecture.md`
- `docs/observability/security-architecture.md`
- `docs/observability/performance-architecture.md`
- `docs/observability/analytics-architecture.md`

## Quality gates for Phase 2
- ✅ Build ✅ Typecheck ✅ Lint
- ✅ All dashboards render with mock data.
- ✅ All health checks + metrics + logging still pass.
- ✅ No circular deps introduced.
- ✅ Production-readiness rated in the final report.
