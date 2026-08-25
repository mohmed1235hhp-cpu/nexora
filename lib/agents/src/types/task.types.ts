import type { AgentCapability } from "./agent.types";

export type TaskStatus = "pending" | "queued" | "running" | "completed" | "failed" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "critical";

export interface AgentTask<TInput = unknown> {
  id: string;
  capability: AgentCapability;
  input: TInput;
  priority: TaskPriority;
  dependsOn: string[];
  metadata?: Record<string, unknown>;
  assignedAgentId?: string;
}

export interface TaskQueueItem {
  task: AgentTask;
  addedAt: number;
  attempts: number;
}
