import type { Result } from "../../core/result/Result";
export interface StepContext { requestId: string; buildId: string; state: Record<string, unknown>; }
export interface StepOutput { name: string; data?: unknown; }
export interface IPipelineStep {
  readonly name: string;
  readonly order: number;
  execute(ctx: StepContext): Promise<Result<StepOutput>>;
}
