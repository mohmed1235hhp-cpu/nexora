import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { MonitoringAgentService } from "./MonitoringAgentService";
import { MonitoringAgentValidator } from "./MonitoringAgentValidator";
import type { IMonitoringAgent } from "./MonitoringAgentInterface";

export class MonitoringAgent extends AgentBase implements IMonitoringAgent {
  readonly id = "monitoring";
  readonly name = "MonitoringAgent";
  readonly capabilities: AgentCapability[] = ["monitoring"];

  private validator = new MonitoringAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new MonitoringAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`MonitoringAgent completed capability 'monitoring'`],
    };
  }
}
