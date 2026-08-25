import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class CreatePlanStep implements IPipelineStep {
  readonly name = "CreatePlan";
  readonly order = 2;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["CreatePlan"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const createPlanStep = new CreatePlanStep();
