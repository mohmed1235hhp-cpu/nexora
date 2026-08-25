import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class ReporterAgent implements IAgent {
  readonly name = "ReporterAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Reporter stub for request " + ctx.requestId });
  }
}
export const reporterAgent = new ReporterAgent();
