# Analytics Architecture

`BaseAnalytics` writes `AnalyticsEvent`s to any `AnalyticsSink`. The
`MemoryAnalyticsSink` is bundled; other sinks (SQL, S3, Kafka) are
external and plug in via the interface.

Domain classes — `UsageAnalytics`, `AiAnalytics`, `ProjectsAnalytics`,
`PerformanceAnalytics`, `UserAnalytics`, `CreditsAnalytics`,
`BuildAnalytics` — share the `aggregate(q)` API returning `count`,
`byKind`, `byDomain`, `firstTs`, `lastTs`.

`AnalyticsDashboard` reads all registered sinks; `AiDashboard`,
`BuildDashboard` project domain-specific views. `ReportGenerator` turns
aggregates plus health + metrics into Markdown + JSON artifacts.
