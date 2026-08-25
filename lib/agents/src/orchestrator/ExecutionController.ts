import type { WorkflowStep } from "../types/workflow.types";
import type { AgentContext } from "../types/agent.types";
import type { AgentResult } from "../types/result.types";
import type { AgentTask } from "../types/task.types";
import { TaskScheduler } from "./TaskScheduler";
import { RetrySystem } from "../execution/RetrySystem";

export class ExecutionController {
  constructor(
    private scheduler: TaskScheduler,
    private retrySystem: RetrySystem,
  ) {}

  async executeStep(
    step: WorkflowStep,
    input: unknown,
    ctx: AgentContext,
  ): Promise<AgentResult> {
    const task: AgentTask = {
      id: `task-${step.id}-${Date.now()}`,
      capability: step.capability,
      input,
      priority: step.priority ?? "normal",
      dependsOn: [],
      assignedAgentId: step.agentId,
    };

    return this.retrySystem.executeWithRetry(
      () => this.scheduler.dispatchTask(task, ctx),
      step.retryCount ?? 3,
    );
  }
}
