import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class PlannerAgent implements IAgent {
  readonly name = "PlannerAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Planner stub for request " + ctx.requestId });
  }
}
export const plannerAgent = new PlannerAgent();
