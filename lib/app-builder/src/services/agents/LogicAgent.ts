import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class LogicAgent implements IAgent {
  readonly name = "LogicAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Logic stub for request " + ctx.requestId });
  }
}
export const logicAgent = new LogicAgent();
