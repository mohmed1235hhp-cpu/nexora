import type { AgentExecutionLog } from "../types/log.types";

export class LogAggregator {
  private executions: AgentExecutionLog[] = [];

  record(log: AgentExecutionLog): void {
    this.executions.push(log);
  }

  getByAgent(agentId: string): AgentExecutionLog[] {
    return this.executions.filter(e => e.agentId === agentId);
  }

  getTotalDuration(agentId: string): number {
    return this.getByAgent(agentId).reduce((sum, l) => sum + l.durationMs, 0);
  }

  getAll(): AgentExecutionLog[] {
    return [...this.executions];
  }
}
