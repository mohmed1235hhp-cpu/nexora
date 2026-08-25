export type StepStatus = "pending" | "running" | "ok" | "failed" | "skipped";
export interface StepResult<T = unknown> { status: StepStatus; output?: T; error?: string; durationMs: number; }
export interface StepContext<Ctx = Record<string, unknown>> {
  ctx: Ctx;
  logger?: { info(msg: string, meta?: Record<string, unknown>): void };
}
export interface WorkflowStep<Ctx = Record<string, unknown>, In = unknown, Out = unknown> {
  name: string;
  run(input: In, ctx: StepContext<Ctx>): Promise<Out>;
}
