import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class AnalyzeRequestStep implements IPipelineStep {
  readonly name = "AnalyzeRequest";
  readonly order = 1;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["AnalyzeRequest"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const analyzeRequestStep = new AnalyzeRequestStep();
