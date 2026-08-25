import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { CodingAgentService } from "./CodingAgentService";
import { CodingAgentValidator } from "./CodingAgentValidator";
import type { ICodingAgent } from "./CodingAgentInterface";

export class CodingAgent extends AgentBase implements ICodingAgent {
  readonly id = "coding";
  readonly name = "CodingAgent";
  readonly capabilities: AgentCapability[] = ["coding"];

  private validator = new CodingAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new CodingAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`CodingAgent completed capability 'coding'`],
    };
  }
}
