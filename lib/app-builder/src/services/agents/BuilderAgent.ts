import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class BuilderAgent implements IAgent {
  readonly name = "BuilderAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Builder stub for request " + ctx.requestId });
  }
}
export const builderAgent = new BuilderAgent();
