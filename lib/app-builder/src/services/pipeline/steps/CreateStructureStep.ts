import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class CreateStructureStep implements IPipelineStep {
  readonly name = "CreateStructure";
  readonly order = 4;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["CreateStructure"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const createStructureStep = new CreateStructureStep();
