import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class GenerateFinalReportStep implements IPipelineStep {
  readonly name = "GenerateFinalReport";
  readonly order = 20;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["GenerateFinalReport"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const generateFinalReportStep = new GenerateFinalReportStep();
