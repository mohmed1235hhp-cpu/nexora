export type BuildStage =
  | "queued" | "plan" | "generate" | "review" | "fix"
  | "tests" | "security" | "perf" | "package" | "report" | "done" | "failed";

export class StatusTracker {
  private state = new Map<string, { stage: BuildStage; updatedAt: number }>();
  set(jobId: string, stage: BuildStage) {
    this.state.set(jobId, { stage, updatedAt: Date.now() });
  }
  get(jobId: string) { return this.state.get(jobId); }
}
export const globalStatus = new StatusTracker();
