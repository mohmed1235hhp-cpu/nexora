import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { TestingAgentService } from "./TestingAgentService";
import { TestingAgentValidator } from "./TestingAgentValidator";
import type { ITestingAgent } from "./TestingAgentInterface";

export class TestingAgent extends AgentBase implements ITestingAgent {
  readonly id = "testing";
  readonly name = "TestingAgent";
  readonly capabilities: AgentCapability[] = ["testing"];

  private validator = new TestingAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new TestingAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`TestingAgent completed capability 'testing'`],
    };
  }
}
