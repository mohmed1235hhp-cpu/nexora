import type { IPipelineStep, StepContext } from "./IPipelineStep";
import { globalBus } from "../../core/events/EventBus";
import { PipelineError } from "../../core/errors/AppBuilderError";
import { analyzeRequestStep } from "./steps/AnalyzeRequestStep";
import { createPlanStep } from "./steps/CreatePlanStep";
import { designArchitectureStep } from "./steps/DesignArchitectureStep";
import { createStructureStep } from "./steps/CreateStructureStep";
import { generateUIStep } from "./steps/GenerateUIStep";
import { generateNavigationStep } from "./steps/GenerateNavigationStep";
import { generateComponentsStep } from "./steps/GenerateComponentsStep";
import { generateStateStep } from "./steps/GenerateStateStep";
import { generateLogicStep } from "./steps/GenerateLogicStep";
import { generateApisStep } from "./steps/GenerateApisStep";
import { generateStorageStep } from "./steps/GenerateStorageStep";
import { generateValidationStep } from "./steps/GenerateValidationStep";
import { generateAssetsStep } from "./steps/GenerateAssetsStep";
import { codeReviewStep } from "./steps/CodeReviewStep";
import { fixErrorsStep } from "./steps/FixErrorsStep";
import { runTestsStep } from "./steps/RunTestsStep";
import { buildStep } from "./steps/BuildStep";
import { generatePreviewStep } from "./steps/GeneratePreviewStep";
import { generateInternalUrlStep } from "./steps/GenerateInternalUrlStep";
import { generateFinalReportStep } from "./steps/GenerateFinalReportStep";

export const DEFAULT_STEPS: IPipelineStep[] = [
  analyzeRequestStep,
  createPlanStep,
  designArchitectureStep,
  createStructureStep,
  generateUIStep,
  generateNavigationStep,
  generateComponentsStep,
  generateStateStep,
  generateLogicStep,
  generateApisStep,
  generateStorageStep,
  generateValidationStep,
  generateAssetsStep,
  codeReviewStep,
  fixErrorsStep,
  runTestsStep,
  buildStep,
  generatePreviewStep,
  generateInternalUrlStep,
  generateFinalReportStep,
];

export class PipelineRunner {
  constructor(private steps: IPipelineStep[] = DEFAULT_STEPS) {}
  async run(requestId: string, buildId: string): Promise<Record<string, unknown>> {
    const ctx: StepContext = { requestId, buildId, state: {} };
    globalBus.emit("pipeline:start", { requestId, buildId, total: this.steps.length });
    for (const step of this.steps) {
      globalBus.emit("step:start", { name: step.name, order: step.order });
      const res = await step.execute(ctx);
      if (!res.ok) {
        // Explicit narrow: strictNullChecks is disabled in this package
        // so the discriminated union does not narrow automatically.
        const errRes = res as { ok: false; error: Error };
        globalBus.emit("step:error", { name: step.name, error: errRes.error.message });
        throw new PipelineError(`Step failed: ${step.name}`, errRes.error);
      }
      globalBus.emit("step:done", { name: step.name, order: step.order });
    }
    globalBus.emit("pipeline:done", { requestId, buildId });
    return ctx.state;
  }
}
export const pipelineRunner = new PipelineRunner();
