import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { VoiceAgentService } from "./VoiceAgentService";
import { VoiceAgentValidator } from "./VoiceAgentValidator";
import type { IVoiceAgent } from "./VoiceAgentInterface";

export class VoiceAgent extends AgentBase implements IVoiceAgent {
  readonly id = "voice";
  readonly name = "VoiceAgent";
  readonly capabilities: AgentCapability[] = ["voice-processing"];

  private validator = new VoiceAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new VoiceAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`VoiceAgent completed capability 'voice-processing'`],
    };
  }
}
