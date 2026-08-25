import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class GenerateAssetsStep implements IPipelineStep {
  readonly name = "GenerateAssets";
  readonly order = 13;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["GenerateAssets"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const generateAssetsStep = new GenerateAssetsStep();
