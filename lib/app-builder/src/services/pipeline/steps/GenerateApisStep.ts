import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class GenerateApisStep implements IPipelineStep {
  readonly name = "GenerateApis";
  readonly order = 10;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["GenerateApis"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const generateApisStep = new GenerateApisStep();
