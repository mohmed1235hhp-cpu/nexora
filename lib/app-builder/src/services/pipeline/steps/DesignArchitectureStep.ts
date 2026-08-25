import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class DesignArchitectureStep implements IPipelineStep {
  readonly name = "DesignArchitecture";
  readonly order = 3;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["DesignArchitecture"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const designArchitectureStep = new DesignArchitectureStep();
