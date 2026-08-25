# Deployment Platform — Architecture

Layered, interface-driven design. Every subsystem exposes an interface in
`src/interfaces/*` and a default in-memory implementation. Nothing binds
to a real external service in Phase 1.

```
+-------------------------+
|  MonitoringDashboard    |
+-------------------------+
           ^
           |
+-------------------------+     +---------------------+
|  TaskDispatcher         | --> |  WorkerScheduler    |
+-------------------------+     +---------------------+
           |                              |
           v                              v
+-------------------------+     +---------------------+
|  QueueManager           |     |  WorkerPool         |
|  (global/priority/...)  |     |  → BuildWorker[]    |
+-------------------------+     +---------------------+
                                          |
                                          v
                                +---------------------+
                                |  BuildEngine        |
                                |  → BuildPipeline    |
                                |    → 14 stages      |
                                +---------------------+
                                          |
                          +---------------+---------------+
                          v               v               v
                +----------------+ +--------------+ +-----------+
                | ArtifactStore  | | HostingSvc   | | Preview   |
                +----------------+ +--------------+ +-----------+
                                          |
                                          v
                                +---------------------+
                                | ReportGenerator     |
                                +---------------------+

ServerManager (placeholder) sits beside WorkerPool; wired in Phase 2.
```
