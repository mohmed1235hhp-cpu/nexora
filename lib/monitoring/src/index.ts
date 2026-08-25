/**
 * @workspace/monitoring — health, metrics, SLO signals.
 *
 * Provides three plug-in-anywhere primitives:
 *   1. HealthRegistry — /healthz + /readyz. Register named checks (db,
 *      redis, storage, queue, upstream provider). Aggregates status.
 *   2. Metrics — Prometheus-compatible counters/histograms/gauges via a
 *      minimal in-process implementation. `metrics.exposition()` returns
 *      OpenMetrics text for `/metrics`. Zero deps.
 *   3. Recorder — request-time helpers: `time()` for latency histograms,
 *      `recordSlowQuery()` for the perf_slow_queries table, `errorEvent()`
 *      to fan out to Sentry/OpenTelemetry when configured.
 *
 * Nothing here talks to Sentry/OTel directly. Adapters live behind the
 * `SENTRY_DSN` / `OTEL_EXPORTER_OTLP_ENDPOINT` env — see docs/observability.
 */

export type HealthStatus = "up" | "degraded" | "down";
export interface HealthCheckResult {
  status: HealthStatus;
  latencyMs?: number;
  detail?: string;
}
export type HealthCheckFn = () => Promise<HealthCheckResult> | HealthCheckResult;

export class HealthRegistry {
  private checks = new Map<string, { fn: HealthCheckFn; critical: boolean }>();

  register(name: string, fn: HealthCheckFn, opts: { critical?: boolean } = {}): void {
    this.checks.set(name, { fn, critical: opts.critical ?? true });
  }

  async liveness(): Promise<{ status: "up" }> {
    return { status: "up" };
  }

  async readiness(): Promise<{
    status: HealthStatus;
    checks: Record<string, HealthCheckResult>;
    ts: string;
  }> {
    const checks: Record<string, HealthCheckResult> = {};
    const results = await Promise.all(
      Array.from(this.checks.entries()).map(async ([name, { fn, critical }]) => {
        const start = Date.now();
        try {
          const r = await fn();
          return [name, critical, { ...r, latencyMs: r.latencyMs ?? Date.now() - start }] as const;
        } catch (err: unknown) {
          return [name, critical, {
            status: "down" as HealthStatus,
            latencyMs: Date.now() - start,
            detail: err instanceof Error ? err.message : String(err),
          }] as const;
        }
      })
    );
    let overall: HealthStatus = "up";
    for (const [name, critical, r] of results) {
      checks[name] = r;
      if (r.status === "down" && critical) overall = "down";
      else if (r.status !== "up" && overall === "up") overall = "degraded";
    }
    return { status: overall, checks, ts: new Date().toISOString() };
  }
}

export const health = new HealthRegistry();

/* -------------------- Metrics -------------------- */

type Labels = Record<string, string | number>;

function labelKey(labels: Labels): string {
  const keys = Object.keys(labels).sort();
  return keys.map(k => `${k}="${String(labels[k]).replace(/"/g, '\\"')}"`).join(",");
}

class Counter {
  private values = new Map<string, number>();
  constructor(public readonly name: string, public readonly help: string) {}
  inc(labels: Labels = {}, by = 1): void {
    const k = labelKey(labels);
    this.values.set(k, (this.values.get(k) ?? 0) + by);
  }
  expose(): string {
    const lines: string[] = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
    for (const [k, v] of this.values) lines.push(`${this.name}${k ? `{${k}}` : ""} ${v}`);
    return lines.join("\n");
  }
}

class Gauge {
  private values = new Map<string, number>();
  constructor(public readonly name: string, public readonly help: string) {}
  set(labels: Labels, v: number): void { this.values.set(labelKey(labels), v); }
  expose(): string {
    const lines: string[] = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} gauge`];
    for (const [k, v] of this.values) lines.push(`${this.name}${k ? `{${k}}` : ""} ${v}`);
    return lines.join("\n");
  }
}

class Histogram {
  private buckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  private counts = new Map<string, number[]>();
  private sums = new Map<string, number>();
  private totals = new Map<string, number>();
  constructor(public readonly name: string, public readonly help: string) {}
  observe(labels: Labels, ms: number): void {
    const k = labelKey(labels);
    let bucket = this.counts.get(k);
    if (!bucket) { bucket = new Array(this.buckets.length).fill(0); this.counts.set(k, bucket); }
    for (let i = 0; i < this.buckets.length; i++) if (ms <= this.buckets[i]!) bucket[i]!++;
    this.sums.set(k, (this.sums.get(k) ?? 0) + ms);
    this.totals.set(k, (this.totals.get(k) ?? 0) + 1);
  }
  expose(): string {
    const lines: string[] = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
    for (const [k, bucket] of this.counts) {
      const prefix = k ? `{${k},` : "{";
      for (let i = 0; i < this.buckets.length; i++) {
        lines.push(`${this.name}_bucket${prefix}le="${this.buckets[i]}"} ${bucket[i]}`);
      }
      lines.push(`${this.name}_bucket${prefix}le="+Inf"} ${this.totals.get(k) ?? 0}`);
      lines.push(`${this.name}_sum${k ? `{${k}}` : ""} ${this.sums.get(k) ?? 0}`);
      lines.push(`${this.name}_count${k ? `{${k}}` : ""} ${this.totals.get(k) ?? 0}`);
    }
    return lines.join("\n");
  }
}

class Registry {
  private counters = new Map<string, Counter>();
  private gauges = new Map<string, Gauge>();
  private histograms = new Map<string, Histogram>();
  counter(name: string, help = ""): Counter {
    let c = this.counters.get(name); if (!c) { c = new Counter(name, help); this.counters.set(name, c); } return c;
  }
  gauge(name: string, help = ""): Gauge {
    let g = this.gauges.get(name); if (!g) { g = new Gauge(name, help); this.gauges.set(name, g); } return g;
  }
  histogram(name: string, help = ""): Histogram {
    let h = this.histograms.get(name); if (!h) { h = new Histogram(name, help); this.histograms.set(name, h); } return h;
  }
  exposition(): string {
    const parts: string[] = [];
    for (const c of this.counters.values()) parts.push(c.expose());
    for (const g of this.gauges.values()) parts.push(g.expose());
    for (const h of this.histograms.values()) parts.push(h.expose());
    return parts.join("\n\n") + "\n";
  }
}

export const metrics = new Registry();

// Standard app metrics — importers can use directly.
export const httpRequestsTotal = metrics.counter("http_requests_total", "HTTP requests");
export const httpDurationMs    = metrics.histogram("http_duration_ms", "HTTP handler latency (ms)");
export const httpErrorsTotal   = metrics.counter("http_errors_total", "HTTP responses with status >= 500");
export const aiRequestsTotal   = metrics.counter("ai_requests_total", "AI provider calls");
export const aiTokensTotal     = metrics.counter("ai_tokens_total", "AI tokens consumed");
export const queueDepthGauge   = metrics.gauge("queue_depth", "Pending jobs per queue");
export const queueJobsTotal    = metrics.counter("queue_jobs_total", "Queue jobs processed");
export const dbQueryDurationMs = metrics.histogram("db_query_duration_ms", "SQL query latency (ms)");

/* -------------------- Recorder helpers -------------------- */

export async function time<T>(
  hist: Histogram, labels: Labels, fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try { return await fn(); }
  finally { hist.observe(labels, Date.now() - start); }
}

export interface ErrorEvent {
  err: unknown;
  where: string;
  ctx?: Record<string, unknown>;
}

/** Fire-and-forget error report. Adapters read this via `onError`. */
const errorListeners: Array<(e: ErrorEvent) => void> = [];
export function onError(fn: (e: ErrorEvent) => void): void { errorListeners.push(fn); }
export function reportError(e: ErrorEvent): void {
  for (const fn of errorListeners) { try { fn(e); } catch { /* ignore */ } }
  // eslint-disable-next-line no-console
  console.error(`[${e.where}]`, e.err, e.ctx ?? {});
}
