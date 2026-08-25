import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { ReviewAgentService } from "./ReviewAgentService";
import { ReviewAgentValidator } from "./ReviewAgentValidator";
import type { IReviewAgent } from "./ReviewAgentInterface";

export class ReviewAgent extends AgentBase implements IReviewAgent {
  readonly id = "review";
  readonly name = "ReviewAgent";
  readonly capabilities: AgentCapability[] = ["review"];

  private validator = new ReviewAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new ReviewAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`ReviewAgent completed capability 'review'`],
    };
  }
}
