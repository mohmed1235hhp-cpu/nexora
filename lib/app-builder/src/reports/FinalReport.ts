import type { BuildJob } from "../pipeline/BuildQueue";
import type { FileArtifact } from "../ai/schemas/common";
import type { SecurityFinding } from "../security/SecurityPass";
import type { PerfHint } from "../perf/PerfPass";

export interface FinalReport {
  jobId: string;
  createdAt: number;
  counts: {
    files: number;
    tests: number;
    screens: number;
    components: number;
    services: number;
    errors: number;
    warnings: number;
  };
  security: { findings: SecurityFinding[]; score: number };
  perf: { hints: PerfHint[]; score: number };
  readinessScore: number;
  artifacts: string[];
}

export function buildFinalReport(input: {
  job: BuildJob;
  blueprint: unknown;
  files: FileArtifact[];
  tests: FileArtifact[];
  security: { findings: SecurityFinding[]; score: number };
  perf: { hints: PerfHint[]; score: number };
  pkg: { artifacts: string[] };
}): FinalReport {
  const { job, files, tests, security, perf, pkg } = input;
  const screens = files.filter((f) => /screens?\//i.test(f.path)).length;
  const components = files.filter((f) => /components?\//i.test(f.path)).length;
  const services = files.filter((f) => /services?\//i.test(f.path)).length;
  const errors = security.findings.filter((s) => s.severity === "high").length;
  const warnings = security.findings.length - errors + perf.hints.length;
  const testCoverage = files.length === 0 ? 0 : Math.min(100, Math.round((tests.length / files.length) * 100));
  const readinessScore = Math.round(
    testCoverage * 0.3 + security.score * 0.35 + perf.score * 0.35,
  );
  return {
    jobId: job.id,
    createdAt: Date.now(),
    counts: {
      files: files.length,
      tests: tests.length,
      screens, components, services, errors, warnings,
    },
    security, perf,
    readinessScore,
    artifacts: pkg.artifacts,
  };
}
