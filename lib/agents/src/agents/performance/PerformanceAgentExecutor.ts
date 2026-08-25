import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { PerformanceAgentService } from "./PerformanceAgentService";
import { PerformanceAgentValidator } from "./PerformanceAgentValidator";
import type { IPerformanceAgent } from "./PerformanceAgentInterface";

export class PerformanceAgent extends AgentBase implements IPerformanceAgent {
  readonly id = "performance";
  readonly name = "PerformanceAgent";
  readonly capabilities: AgentCapability[] = ["performance-analysis"];

  private validator = new PerformanceAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new PerformanceAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`PerformanceAgent completed capability 'performance-analysis'`],
    };
  }
}
