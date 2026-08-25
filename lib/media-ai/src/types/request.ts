import type { AgentId, TaskId } from "./ids.js";
export interface BaseRequest {
  taskId: TaskId;
  userId?: string;
  agentHint?: AgentId;
  meta?: Record<string, unknown>;
}
