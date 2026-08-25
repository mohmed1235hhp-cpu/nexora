import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { PlanningAgentService } from "./PlanningAgentService";
import { PlanningAgentValidator } from "./PlanningAgentValidator";
import type { IPlanningAgent } from "./PlanningAgentInterface";

export class PlanningAgent extends AgentBase implements IPlanningAgent {
  readonly id = "planning";
  readonly name = "PlanningAgent";
  readonly capabilities: AgentCapability[] = ["planning"];

  private validator = new PlanningAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new PlanningAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`PlanningAgent completed capability 'planning'`],
    };
  }
}
