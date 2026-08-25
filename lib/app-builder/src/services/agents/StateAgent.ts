import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class StateAgent implements IAgent {
  readonly name = "StateAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "State stub for request " + ctx.requestId });
  }
}
export const stateAgent = new StateAgent();
