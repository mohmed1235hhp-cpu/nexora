import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class GenerateValidationStep implements IPipelineStep {
  readonly name = "GenerateValidation";
  readonly order = 12;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["GenerateValidation"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const generateValidationStep = new GenerateValidationStep();
