# Worker Architecture

- `BuildWorker` owns one build at a time and reports lifecycle state.
- `WorkerRegistry` tracks all workers.
- `WorkerPool` provisions N in-process workers around a shared `IBuildEngine`.
- `WorkerScheduler` waits for the next idle worker and dispatches.
- `WorkerMonitor` produces aggregate counters for the dashboard.
- `WorkerHealthChecker` emits health samples per worker (used by monitoring).
- `WorkerRetryManager` tracks per-request attempts with exponential-ish backoff.
- `InMemoryLogSink` collects logs from workers by scope.

Phase 2 will replace the in-process pool with real worker threads/processes.
