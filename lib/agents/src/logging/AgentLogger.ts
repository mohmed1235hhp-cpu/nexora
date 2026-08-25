import type { AgentLogEntry, LogLevel } from "../types/log.types";

export class AgentLogger {
  private entries: AgentLogEntry[] = [];
  private maxEntries = 10_000;

  log(agentId: string, level: LogLevel | string, message: string, meta?: Record<string, unknown>): void {
    const entry: AgentLogEntry = {
      agentId,
      level: (level as LogLevel),
      message,
      timestamp: Date.now(),
      meta,
    };
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) this.entries.shift();
  }

  getEntries(agentId?: string): AgentLogEntry[] {
    if (!agentId) return [...this.entries];
    return this.entries.filter(e => e.agentId === agentId);
  }

  clear(): void {
    this.entries = [];
  }
}
