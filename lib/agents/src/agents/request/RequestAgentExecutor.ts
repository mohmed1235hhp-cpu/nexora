import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { RequestAgentService } from "./RequestAgentService";
import { RequestAgentValidator } from "./RequestAgentValidator";
import type { IRequestAgent } from "./RequestAgentInterface";

export class RequestAgent extends AgentBase implements IRequestAgent {
  readonly id = "request";
  readonly name = "RequestAgent";
  readonly capabilities: AgentCapability[] = ["request-parsing"];

  private validator = new RequestAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new RequestAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`RequestAgent completed capability 'request-parsing'`],
    };
  }
}
