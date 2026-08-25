import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class CodeReviewStep implements IPipelineStep {
  readonly name = "CodeReview";
  readonly order = 14;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["CodeReview"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const codeReviewStep = new CodeReviewStep();
