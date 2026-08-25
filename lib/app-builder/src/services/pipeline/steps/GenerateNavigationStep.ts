import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class GenerateNavigationStep implements IPipelineStep {
  readonly name = "GenerateNavigation";
  readonly order = 6;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["GenerateNavigation"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const generateNavigationStep = new GenerateNavigationStep();
