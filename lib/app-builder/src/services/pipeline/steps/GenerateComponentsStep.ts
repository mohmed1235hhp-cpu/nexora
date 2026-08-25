import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class GenerateComponentsStep implements IPipelineStep {
  readonly name = "GenerateComponents";
  readonly order = 7;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["GenerateComponents"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const generateComponentsStep = new GenerateComponentsStep();
