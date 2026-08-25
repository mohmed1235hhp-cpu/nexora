# @workspace/observability

Independent **observability platform** for the media-platform monorepo.
Ships as a self-contained workspace package with no external SaaS
dependencies. Every sub-system is expressed as an interface with pluggable
implementations, so higher-level systems (AI Router, Multi-Agent, Website
Builder, App Builder, Media, Deploy) can adopt it incrementally without
coupling to a vendor.

## Sub-systems

| Layer   | Status  | Entry point                          |
|---------|---------|--------------------------------------|
| Core    | Phase 1 | `@workspace/observability/core`      |
| Logging | Phase 1 | `@workspace/observability/logging`   |
| Health  | Phase 1 | `@workspace/observability/health`    |
| Metrics | Phase 1 | `@workspace/observability/metrics`   |
| Dashboards (data) | Phase 1 | `@workspace/observability/dashboards` |
| Security / Perf / Analytics / Alerts / Auto-Recovery / Reports / UI | **Phase 2** | see `PHASE2_PLAN.md` |

## Design rules

1. **No external services.** Providers only — the app decides where things go.
2. **No breaking API changes.** This package is additive; existing packages continue to work unchanged.
3. **Interface first.** Every capability is declared as a TS interface; concrete implementations are swappable.
4. **Provider Layer only.** No opinionated wiring — call `LoggerFactory.create()`, `new HealthRunner()`, `new MetricRegistry()` explicitly.
5. **Safe by default.** Log sinks never throw upward; health checks are timed out; metrics are lock-free.

## Quick start

```ts
import { LoggerFactory } from "@workspace/observability/logging";
import { HealthRegistry, HealthRunner, ApplicationHealth, MemoryHealth } from "@workspace/observability/health";
import { MetricRegistry, SystemCollector, PrometheusExporter } from "@workspace/observability/metrics";
import { SystemDashboard } from "@workspace/observability/dashboards";

const logger  = new LoggerFactory().create({ domain: "app" });
const metrics = new MetricRegistry();
new SystemCollector(metrics).start();

const health  = new HealthRegistry();
health.register(new ApplicationHealth());
health.register(new MemoryHealth());
const runner  = new HealthRunner(health);

await logger.info("boot complete");
console.log(new PrometheusExporter(metrics).export());
console.log(await runner.runAll());
```
