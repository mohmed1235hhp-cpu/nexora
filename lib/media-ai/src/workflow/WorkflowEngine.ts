import type { StepContext, StepResult, WorkflowStep } from "./WorkflowTypes.js";
export interface WorkflowRun<Ctx> {
  id: string;
  steps: Array<{ name: string; result: StepResult }>;
  ctx: Ctx;
}
export class WorkflowEngine<Ctx extends Record<string, unknown>> {
  constructor(private steps: WorkflowStep<Ctx>[]) {}
  async run(initialInput: unknown, ctx: Ctx): Promise<WorkflowRun<Ctx>> {
    const id = "wf_" + Math.random().toString(36).slice(2);
    const results: Array<{ name: string; result: StepResult }> = [];
    let input: unknown = initialInput;
    for (const step of this.steps) {
      const started = Date.now();
      const sc: StepContext<Ctx> = { ctx };
      try {
        const out = await step.run(input, sc);
        results.push({ name: step.name, result: { status: "ok", output: out, durationMs: Date.now() - started } });
        input = out;
      } catch (e) {
        results.push({ name: step.name, result: { status: "failed", error: (e as Error).message, durationMs: Date.now() - started } });
        break;
      }
    }
    return { id, steps: results, ctx };
  }
}
