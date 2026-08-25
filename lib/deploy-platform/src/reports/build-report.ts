import type { BuildReport } from '../types/report.js';
import type { BuildResult } from '../types/build.js';
import { newId } from '../utils/id.js';
export function makeBuildReport(result: BuildResult, extras?: { fileCount?: number; sizeBytes?: number }): BuildReport {
  const errors = result.stages.reduce((n, s) => n + s.errors.length, 0);
  const warnings = result.stages.reduce((n, s) => n + s.warnings.length, 0);
  return {
    id: newId('rpt'), buildId: result.id, projectId: result.projectId,
    generatedAt: Date.now(),
    fileCount: extras?.fileCount ?? result.artifactIds.length,
    errorCount: errors, warningCount: warnings,
    durationMs: result.endedAt - result.startedAt,
    sizeBytes: extras?.sizeBytes ?? 0,
    status: result.status, stages: result.stages,
  };
}
