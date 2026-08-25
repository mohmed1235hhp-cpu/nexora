import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { ArchitectureAgentService } from "./ArchitectureAgentService";
import { ArchitectureAgentValidator } from "./ArchitectureAgentValidator";
import type { IArchitectureAgent } from "./ArchitectureAgentInterface";

export class ArchitectureAgent extends AgentBase implements IArchitectureAgent {
  readonly id = "architecture";
  readonly name = "ArchitectureAgent";
  readonly capabilities: AgentCapability[] = ["architecture"];

  private validator = new ArchitectureAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new ArchitectureAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`ArchitectureAgent completed capability 'architecture'`],
    };
  }
}
