import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class AssetsAgent implements IAgent {
  readonly name = "AssetsAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Assets stub for request " + ctx.requestId });
  }
}
export const assetsAgent = new AssetsAgent();
