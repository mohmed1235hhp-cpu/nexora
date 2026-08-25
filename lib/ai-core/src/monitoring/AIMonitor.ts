import { QueueTracker } from "./QueueTracker";
import { LatencyTracker } from "./LatencyTracker";
import type { DashboardSnapshot, ProviderDashboardStats } from "./DashboardMetrics";

interface ProviderStat {
  requests: number;
  successes: number;
  failures: number;
  totalLatencyMs: number;
  totalCostUsd: number;
  lastError?: string;
  lastUsedAt?: string;
}

/**
 * AIMonitor — the data source behind the Monitoring Dashboard requirement:
 * current/fallback provider usage, daily usage, cost, average response
 * time, error rate, and per-provider health, all tracked per request as it
 * flows through FallbackEngine.
 */
export class AIMonitor {
  readonly queue = new QueueTracker();
  readonly latency = new LatencyTracker();
  private requests = 0;
  private successes = 0;
  private failures = 0;
  private totalCostUsd = 0;
  private perProvider = new Map<string, ProviderStat>();

  private statFor(providerId: string): ProviderStat {
    let s = this.perProvider.get(providerId);
    if (!s) {
      s = { requests: 0, successes: 0, failures: 0, totalLatencyMs: 0, totalCostUsd: 0 };
      this.perProvider.set(providerId, s);
    }
    return s;
  }

  /** Call once per provider attempt in the fallback chain (not just the winner). */
  recordProviderAttempt(providerId: string, ok: boolean, latencyMs: number, costUsd = 0, error?: string): void {
    const s = this.statFor(providerId);
    s.requests++;
    s.totalLatencyMs += latencyMs;
    s.totalCostUsd += costUsd;
    s.lastUsedAt = new Date().toISOString();
    if (ok) {
      s.successes++;
    } else {
      s.failures++;
      s.lastError = error;
    }
  }

  recordSuccess(ms: number, costUsd = 0): void {
    this.requests++;
    this.successes++;
    this.totalCostUsd += costUsd;
    this.latency.record(ms);
  }

  recordFailure(ms: number): void {
    this.requests++;
    this.failures++;
    this.latency.record(ms);
  }

  snapshot(): DashboardSnapshot {
    const avg = this.latency.average();
    const providers: ProviderDashboardStats[] = Array.from(this.perProvider.entries()).map(([providerId, s]) => ({
      providerId,
      requests: s.requests,
      successes: s.successes,
      failures: s.failures,
      averageLatencyMs: s.requests ? Math.round(s.totalLatencyMs / s.requests) : 0,
      totalCostUsd: Math.round(s.totalCostUsd * 10000) / 10000,
      lastError: s.lastError,
      lastUsedAt: s.lastUsedAt,
    }));

    return {
      requests: this.requests,
      successes: this.successes,
      failures: this.failures,
      averageLatencyMs: avg,
      successRate: this.requests ? this.successes / this.requests : 0,
      failureRate: this.requests ? this.failures / this.requests : 0,
      totalCostUsd: Math.round(this.totalCostUsd * 10000) / 10000,
      providers,
    };
  }
}
