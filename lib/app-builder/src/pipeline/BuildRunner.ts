import type { BuildJob } from "./BuildQueue";
import type { AgentRegistry } from "../agents/AgentRegistry";
import type { StructuredLogger } from "./logs/StructuredLogger";
import type { StatusTracker } from "./status/StatusTracker";
import { runPlanStage } from "./stages/PlanStage";
import { runGenerateStage } from "./stages/GenerateStage";
import { runReviewStage } from "./stages/ReviewStage";
import { runFixStage } from "./stages/FixStage";
import { runTestsStage } from "./stages/TestsStage";
import { runPackageStage } from "./stages/PackageStage";
import { runSecurityPass } from "../security/SecurityPass";
import { runPerfPass } from "../perf/PerfPass";
import { buildFinalReport } from "../reports/FinalReport";

export class BuildRunner {
  constructor(
    private agents: AgentRegistry,
    private logger: StructuredLogger,
    private status: StatusTracker,
  ) {}

  async run(job: BuildJob) {
    const ctx = {
      jobId: job.id,
      spec: job.spec,
      log: (level: "info" | "warn" | "error", msg: string, meta?: unknown) =>
        this.logger.push(job.id, level, msg, meta),
    };

    this.status.set(job.id, "plan");
    const blueprint = await runPlanStage(ctx, this.agents);

    this.status.set(job.id, "generate");
    const generated = await runGenerateStage(ctx, this.agents, blueprint);

    this.status.set(job.id, "review");
    const reviewed = await runReviewStage(ctx, this.agents, generated);

    this.status.set(job.id, "fix");
    const fixed = await runFixStage(ctx, this.agents, reviewed);

    this.status.set(job.id, "tests");
    const tests = await runTestsStage(ctx, this.agents, fixed);

    this.status.set(job.id, "security");
    const sec = await runSecurityPass(ctx, fixed);

    this.status.set(job.id, "perf");
    const perf = await runPerfPass(ctx, fixed);

    this.status.set(job.id, "package");
    const pkg = await runPackageStage(ctx, fixed, tests);

    this.status.set(job.id, "report");
    const report = buildFinalReport({
      job, blueprint, files: fixed, tests, security: sec, perf, pkg,
    });

    this.status.set(job.id, "done");
    return report;
  }
}
