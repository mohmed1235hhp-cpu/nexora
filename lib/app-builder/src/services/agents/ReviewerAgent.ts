import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class ReviewerAgent implements IAgent {
  readonly name = "ReviewerAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Reviewer stub for request " + ctx.requestId });
  }
}
export const reviewerAgent = new ReviewerAgent();
