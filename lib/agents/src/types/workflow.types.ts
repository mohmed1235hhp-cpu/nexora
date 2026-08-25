import type { AgentCapability } from "./agent.types";
import type { TaskPriority } from "./task.types";

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  capability: AgentCapability;
  inputTemplate?: unknown;
  inputFromStep?: string;
  dependsOn: string[];
  agentId?: string;
  priority?: TaskPriority;
  retryCount?: number;
  timeoutMs?: number;
}

export interface WorkflowExecutionState {
  workflowId: string;
  currentStepIndex: number;
  completedSteps: string[];
  failedSteps: string[];
  stepResults: Map<string, unknown>;
  startedAt: number;
  completedAt?: number;
}
