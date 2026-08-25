import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class UIAgent implements IAgent {
  readonly name = "UIAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "UI stub for request " + ctx.requestId });
  }
}
export const uiAgent = new UIAgent();
