import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class GenerateStateStep implements IPipelineStep {
  readonly name = "GenerateState";
  readonly order = 8;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["GenerateState"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const generateStateStep = new GenerateStateStep();
