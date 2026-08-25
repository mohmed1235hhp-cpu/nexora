import type { IPipelineStep, StepContext, StepOutput } from "../IPipelineStep";
import { ok, type Result } from "../../../core/result/Result";
export class RunTestsStep implements IPipelineStep {
  readonly name = "RunTests";
  readonly order = 16;
  async execute(ctx: StepContext): Promise<Result<StepOutput>> {
    ctx.state["RunTests"] = { ranAt: Date.now() };
    return ok({ name: this.name, data: { buildId: ctx.buildId } });
  }
}
export const runTestsStep = new RunTestsStep();
