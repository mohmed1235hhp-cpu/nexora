import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class ValidationAgent implements IAgent {
  readonly name = "ValidationAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Validation stub for request " + ctx.requestId });
  }
}
export const validationAgent = new ValidationAgent();
