import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class AnalyzerAgent implements IAgent {
  readonly name = "AnalyzerAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Analyzer stub for request " + ctx.requestId });
  }
}
export const analyzerAgent = new AnalyzerAgent();
