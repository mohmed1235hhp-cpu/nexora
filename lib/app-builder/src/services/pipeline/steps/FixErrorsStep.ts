import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class FixErrorsStep implements IPipelineStep {
  readonly name = "FixErrors";
  readonly order = 15;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["FixErrors"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const fixErrorsStep = new FixErrorsStep();
