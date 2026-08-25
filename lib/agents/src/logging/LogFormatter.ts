import type { AgentLogEntry } from "../types/log.types";

export class LogFormatter {
  format(entry: AgentLogEntry): string {
    const time = new Date(entry.timestamp).toISOString();
    return `[${time}] [${entry.level.toUpperCase()}] [${entry.agentId}] ${entry.message}`;
  }

  formatAll(entries: AgentLogEntry[]): string {
    return entries.map(e => this.format(e)).join("\n");
  }
}
