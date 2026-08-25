import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { ImageAgentService } from "./ImageAgentService";
import { ImageAgentValidator } from "./ImageAgentValidator";
import type { IImageAgent } from "./ImageAgentInterface";

export class ImageAgent extends AgentBase implements IImageAgent {
  readonly id = "image";
  readonly name = "ImageAgent";
  readonly capabilities: AgentCapability[] = ["image-generation"];

  private validator = new ImageAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new ImageAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`ImageAgent completed capability 'image-generation'`],
    };
  }
}
