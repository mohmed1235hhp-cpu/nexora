import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class PreviewAgent implements IAgent {
  readonly name = "PreviewAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Preview stub for request " + ctx.requestId });
  }
}
export const previewAgent = new PreviewAgent();
