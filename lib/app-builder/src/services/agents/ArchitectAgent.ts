import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class ArchitectAgent implements IAgent {
  readonly name = "ArchitectAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Architect stub for request " + ctx.requestId });
  }
}
export const architectAgent = new ArchitectAgent();
