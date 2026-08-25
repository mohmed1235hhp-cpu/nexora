import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class BuildStep implements IPipelineStep {
  readonly name = "Build";
  readonly order = 17;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["Build"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const buildStep = new BuildStep();
