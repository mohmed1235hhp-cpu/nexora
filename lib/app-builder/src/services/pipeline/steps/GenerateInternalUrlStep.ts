import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class GenerateInternalUrlStep implements IPipelineStep {
  readonly name = "GenerateInternalUrl";
  readonly order = 19;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["GenerateInternalUrl"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const generateInternalUrlStep = new GenerateInternalUrlStep();
