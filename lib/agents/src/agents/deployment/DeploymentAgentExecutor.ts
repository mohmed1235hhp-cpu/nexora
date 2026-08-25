import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { DeploymentAgentService } from "./DeploymentAgentService";
import { DeploymentAgentValidator } from "./DeploymentAgentValidator";
import type { IDeploymentAgent } from "./DeploymentAgentInterface";

export class DeploymentAgent extends AgentBase implements IDeploymentAgent {
  readonly id = "deployment";
  readonly name = "DeploymentAgent";
  readonly capabilities: AgentCapability[] = ["deployment"];

  private validator = new DeploymentAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new DeploymentAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`DeploymentAgent completed capability 'deployment'`],
    };
  }
}
