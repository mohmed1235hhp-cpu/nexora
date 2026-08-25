export interface AgentMonitorStats {
  totalAgents: number;
  activeAgents: number;
  busyAgents: number;
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageDurationMs: number;
  successRate: number;
}

export class AgentMonitor {
  private activeAgentIds = new Set<string>();
  private taskCount = 0;
  private successCount = 0;
  private failCount = 0;
  private totalDuration = 0;
  private startedAgents = new Set<string>();

  recordAgentStart(id: string): void {
    this.activeAgentIds.add(id);
    this.startedAgents.add(id);
  }

  recordAgentEnd(id: string, ok: boolean, durationMs: number): void {
    this.activeAgentIds.delete(id);
    this.taskCount++;
    this.totalDuration += durationMs;
    if (ok) this.successCount++; else this.failCount++;
  }

  getActiveAgents(): string[] {
    return Array.from(this.activeAgentIds);
  }

  getStats(): AgentMonitorStats {
    return {
      totalAgents: this.startedAgents.size,
      activeAgents: this.startedAgents.size,
      busyAgents: this.activeAgentIds.size,
      totalTasks: this.taskCount,
      successfulTasks: this.successCount,
      failedTasks: this.failCount,
      averageDurationMs: this.taskCount > 0 ? this.totalDuration / this.taskCount : 0,
      successRate: this.taskCount > 0 ? this.successCount / this.taskCount : 0,
    };
  }

  reset(): void {
    this.activeAgentIds.clear();
    this.taskCount = 0;
    this.successCount = 0;
    this.failCount = 0;
    this.totalDuration = 0;
  }
}
