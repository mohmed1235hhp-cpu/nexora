import type { MetricRegistry } from "../MetricRegistry.js";
import type { Counter } from "../Counter.js";
import type { Histogram } from "../Histogram.js";
/** Manual API: user code calls observe() when a request finishes. */
export class RequestCollector {
  readonly total: Counter;
  readonly errors: Counter;
  readonly latency: Histogram;
  constructor(reg: MetricRegistry) {
    this.total   = reg.counter("http_requests_total", "Total HTTP requests");
    this.errors  = reg.counter("http_requests_errors_total", "HTTP requests that returned >=500");
    this.latency = reg.histogram("http_request_duration_ms", "Server-observed latency");
  }
  observe(status: number, durationMs: number, tags?: Record<string, string | number>): void {
    this.total.inc(1, tags);
    if (status >= 500) this.errors.inc(1, tags);
    this.latency.observe(durationMs);
  }
}
