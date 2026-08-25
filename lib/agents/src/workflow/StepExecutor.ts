import type { WorkflowStep } from "../types/workflow.types";
import type { AgentContext } from "../types/agent.types";
import type { AgentResult } from "../types/result.types";
import { ExecutionController } from "../orchestrator/ExecutionController";

/**
 * Thin wrapper — mostly delegates to ExecutionController.
 */
export class StepExecutor {
  constructor(private controller: ExecutionController) {}

  async execute(step: WorkflowStep, input: unknown, ctx: AgentContext): Promise<AgentResult> {
    return this.controller.executeStep(step, input, ctx);
  }
}
