# Monitoring Architecture

**Layers:** Core primitives (`EventBus`, `Clock`, `Registry`, `Result`) →
Logging (Logger + sinks/formatters/filters) → Metrics (`MetricRegistry` with
counter/gauge/histogram/summary) → Health (`HealthRegistry` + `HealthRunner`
+ `HealthAggregator`).

Metrics are lock-free; sinks never throw upward; health checks are timed
out. The Phase 2 `AlertManager` consumes metric samples + health snapshots
via evaluate-on-demand rules — it never polls upstream directly, keeping
this package free of scheduling opinions.
