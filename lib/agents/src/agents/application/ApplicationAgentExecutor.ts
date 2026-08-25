import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { ApplicationAgentService } from "./ApplicationAgentService";
import { ApplicationAgentValidator } from "./ApplicationAgentValidator";
import type { IApplicationAgent } from "./ApplicationAgentInterface";

export class ApplicationAgent extends AgentBase implements IApplicationAgent {
  readonly id = "application";
  readonly name = "ApplicationAgent";
  readonly capabilities: AgentCapability[] = ["application-generation"];

  private validator = new ApplicationAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new ApplicationAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`ApplicationAgent completed capability 'application-generation'`],
    };
  }
}
