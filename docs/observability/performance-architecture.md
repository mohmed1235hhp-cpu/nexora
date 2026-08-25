# Performance Architecture

`PerformanceManager` bundles the optimizers:

- `MemoryOptimizer` — `process.memoryUsage()` snapshot + optional `--expose-gc`.
- `CpuOptimizer` — user/system deltas + optional `loadavg` + `yield()` helper.
- `BundleOptimizer` — offline analyzer over `Record<module, bytes>`.
- `QueryOptimizer` — samples DB timings; reports p95/avg/slowest.
- `CachingLayer` — LRU + TTL + stampede protection via single-flight promises.
- `CompressionLayer` — gzip/brotli round-trip helpers.
- `LazyLoader` — memoized single-flight factory.

`PerformanceManager.snapshot()` returns a `PerformanceSnapshot` suitable
for the `PerformanceDashboard`.
