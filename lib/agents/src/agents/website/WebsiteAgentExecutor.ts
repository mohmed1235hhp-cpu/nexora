import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { WebsiteAgentService } from "./WebsiteAgentService";
import { WebsiteAgentValidator } from "./WebsiteAgentValidator";
import type { IWebsiteAgent } from "./WebsiteAgentInterface";

export class WebsiteAgent extends AgentBase implements IWebsiteAgent {
  readonly id = "website";
  readonly name = "WebsiteAgent";
  readonly capabilities: AgentCapability[] = ["website-generation"];

  private validator = new WebsiteAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new WebsiteAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`WebsiteAgent completed capability 'website-generation'`],
    };
  }
}
