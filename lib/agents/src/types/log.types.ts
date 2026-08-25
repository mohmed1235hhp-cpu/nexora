export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AgentLogEntry {
  agentId: string;
  level: LogLevel;
  message: string;
  timestamp: number;
  meta?: Record<string, unknown>;
  sessionId?: string;
}

export interface AgentExecutionLog {
  agentId: string;
  taskId: string;
  startTime: number;
  endTime: number;
  decisions: string[];
  filesCount: number;
  errors: string[];
  fixes: string[];
  durationMs: number;
}
