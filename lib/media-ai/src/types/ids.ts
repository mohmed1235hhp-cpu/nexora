export type MediaId = string & { __brand: "MediaId" };
export type TaskId = string & { __brand: "TaskId" };
export type WorkflowId = string & { __brand: "WorkflowId" };
export type AgentId = string & { __brand: "AgentId" };
export const asMediaId = (v: string) => v as MediaId;
export const asTaskId = (v: string) => v as TaskId;
export const asWorkflowId = (v: string) => v as WorkflowId;
export const asAgentId = (v: string) => v as AgentId;
