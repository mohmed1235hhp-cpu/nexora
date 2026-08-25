import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { ResearchAgentService } from "./ResearchAgentService";
import { ResearchAgentValidator } from "./ResearchAgentValidator";
import type { IResearchAgent } from "./ResearchAgentInterface";

export class ResearchAgent extends AgentBase implements IResearchAgent {
  readonly id = "research";
  readonly name = "ResearchAgent";
  readonly capabilities: AgentCapability[] = ["research"];

  private validator = new ResearchAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new ResearchAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`ResearchAgent completed capability 'research'`],
    };
  }
}
