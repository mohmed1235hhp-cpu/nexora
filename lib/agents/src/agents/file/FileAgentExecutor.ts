import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { FileAgentService } from "./FileAgentService";
import { FileAgentValidator } from "./FileAgentValidator";
import type { IFileAgent } from "./FileAgentInterface";

export class FileAgent extends AgentBase implements IFileAgent {
  readonly id = "file";
  readonly name = "FileAgent";
  readonly capabilities: AgentCapability[] = ["file-handling"];

  private validator = new FileAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new FileAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`FileAgent completed capability 'file-handling'`],
    };
  }
}
