import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";
import { AgentBase } from "../../core/AgentBase";
import { AgentError, AgentErrorCode } from "../../core/AgentErrors";
import { DocumentationAgentService } from "./DocumentationAgentService";
import { DocumentationAgentValidator } from "./DocumentationAgentValidator";
import type { IDocumentationAgent } from "./DocumentationAgentInterface";

export class DocumentationAgent extends AgentBase implements IDocumentationAgent {
  readonly id = "documentation";
  readonly name = "DocumentationAgent";
  readonly capabilities: AgentCapability[] = ["documentation"];

  private validator = new DocumentationAgentValidator();

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const validation = this.validator.validate(task);
    if (!validation.valid) {
      throw new AgentError(AgentErrorCode.ValidationFailed, validation.errors.join("; "), this.id, task.id);
    }
    const service = new DocumentationAgentService(ctx.router);
    const result = await service.run(task.input, task.metadata);
    return {
      ok: result.ok,
      output: result.output,
      error: result.error,
      durationMs: 0,
      decisions: [`DocumentationAgent completed capability 'documentation'`],
    };
  }
}
