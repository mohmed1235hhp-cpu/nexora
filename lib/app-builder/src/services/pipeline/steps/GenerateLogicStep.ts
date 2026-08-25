import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class GenerateLogicStep implements IPipelineStep {
  readonly name = "GenerateLogic";
  readonly order = 9;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["GenerateLogic"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const generateLogicStep = new GenerateLogicStep();
