import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class TesterAgent implements IAgent {
  readonly name = "TesterAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Tester stub for request " + ctx.requestId });
  }
}
export const testerAgent = new TesterAgent();
