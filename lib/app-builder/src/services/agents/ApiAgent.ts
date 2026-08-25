import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class ApiAgent implements IAgent {
  readonly name = "ApiAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Api stub for request " + ctx.requestId });
  }
}
export const apiAgent = new ApiAgent();
