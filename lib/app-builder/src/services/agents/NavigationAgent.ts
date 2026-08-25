import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class NavigationAgent implements IAgent {
  readonly name = "NavigationAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Navigation stub for request " + ctx.requestId });
  }
}
export const navigationAgent = new NavigationAgent();
