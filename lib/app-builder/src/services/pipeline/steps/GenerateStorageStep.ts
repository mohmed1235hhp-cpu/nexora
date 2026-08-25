import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class GenerateStorageStep implements IPipelineStep {
  readonly name = "GenerateStorage";
  readonly order = 11;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["GenerateStorage"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const generateStorageStep = new GenerateStorageStep();
