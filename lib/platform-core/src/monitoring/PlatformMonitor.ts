/**
 * Internal Monitoring Dashboard data source.
 * Aggregates runtime metrics for the platform.
 */
export interface AgentMetrics {
  readonly agentId: string;
  running: boolean;
  totalCalls: number;
  totalErrors: number;
  totalRetries: number;
  totalDurationMs: number;
}

export interface DashboardSnapshot {
  readonly ts: number;
  readonly agents: readonly AgentMetrics[];
  readonly avgResponseMs: number;
  readonly queueSize: number;
  readonly memoryUsageBytes: number;
  readonly cpuUsagePct: number;
  readonly errors24h: number;
  readonly retries24h: number;
  readonly totalRequests: number;
}

export class PlatformMonitor {
  private readonly agents = new Map<string, AgentMetrics>();
  private queueSize = 0;
  private totalRequests = 0;
  private durations: number[] = [];
  private errors24h = 0;
  private retries24h = 0;

  private ensure(agentId: string): AgentMetrics {
    let m = this.agents.get(agentId);
    if (!m) {
      m = { agentId, running: false, totalCalls: 0, totalErrors: 0, totalRetries: 0, totalDurationMs: 0 };
      this.agents.set(agentId, m);
    }
    return m;
  }

  markAgentStart(agentId: string): void {
    const m = this.ensure(agentId);
    m.running = true;
    m.totalCalls += 1;
  }
  markAgentEnd(agentId: string, durationMs: number, ok: boolean, retries = 0): void {
    const m = this.ensure(agentId);
    m.running = false;
    m.totalDurationMs += durationMs;
    m.totalRetries += retries;
    this.retries24h += retries;
    if (!ok) {
      m.totalErrors += 1;
      this.errors24h += 1;
    }
    this.durations.push(durationMs);
    if (this.durations.length > 500) this.durations.shift();
  }

  markQueueDelta(delta: number): void {
    this.queueSize = Math.max(0, this.queueSize + delta);
  }
  markRequest(): void {
    this.totalRequests += 1;
  }

  snapshot(): DashboardSnapshot {
    const avg = this.durations.length === 0 ? 0 : this.durations.reduce((a, b) => a + b, 0) / this.durations.length;
    // Best-effort resource metrics; safe on both Node and workers.
    const mem =
      typeof (globalThis as { process?: { memoryUsage?: () => { heapUsed: number } } }).process?.memoryUsage === "function"
        ? (globalThis as { process: { memoryUsage: () => { heapUsed: number } } }).process.memoryUsage().heapUsed
        : 0;
    return {
      ts: Date.now(),
      agents: Array.from(this.agents.values()),
      avgResponseMs: Math.round(avg),
      queueSize: this.queueSize,
      memoryUsageBytes: mem,
      cpuUsagePct: 0,
      errors24h: this.errors24h,
      retries24h: this.retries24h,
      totalRequests: this.totalRequests,
    };
  }

  renderText(): string {
    const s = this.snapshot();
    const rows = s.agents
      .map(
        (a) =>
          `  ${a.agentId.padEnd(28)} calls=${a.totalCalls}  errs=${a.totalErrors}  retries=${a.totalRetries}  avg=${
            a.totalCalls ? Math.round(a.totalDurationMs / a.totalCalls) : 0
          }ms  ${a.running ? "RUNNING" : "idle"}`,
      )
      .join("\n");
    return `AI Platform Dashboard @ ${new Date(s.ts).toISOString()}
totalRequests=${s.totalRequests}  avgResponse=${s.avgResponseMs}ms  queue=${s.queueSize}  errs24h=${s.errors24h}  retries24h=${s.retries24h}
agents:
${rows}`;
  }
}
