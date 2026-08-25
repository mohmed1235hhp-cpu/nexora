import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class GenerateUIStep implements IPipelineStep {
  readonly name = "GenerateUI";
  readonly order = 5;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["GenerateUI"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const generateUIStep = new GenerateUIStep();
