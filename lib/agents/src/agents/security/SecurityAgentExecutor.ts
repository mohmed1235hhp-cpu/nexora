import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { SecurityAgentService } from "./SecurityAgentService";
import { SecurityAgentValidator } from "./SecurityAgentValidator";
import type { ISecurityAgent } from "./SecurityAgentInterface";

export class SecurityAgent extends AgentBase implements ISecurityAgent {
  readonly id = "security";
  readonly name = "SecurityAgent";
  readonly capabilities: AgentCapability[] = ["security-analysis"];

  private validator = new SecurityAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new SecurityAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`SecurityAgent completed capability 'security-analysis'`],
    };
  }
}
