import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class GeneratePreviewStep implements IPipelineStep {
  readonly name = "GeneratePreview";
  readonly order = 18;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["GeneratePreview"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const generatePreviewStep = new GeneratePreviewStep();
