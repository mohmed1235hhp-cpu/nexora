import type { BuildStageResult } from './build.js';
export interface BuildReport {
  readonly id: string;
  readonly buildId: string;
  readonly projectId: string;
  readonly generatedAt: number;
  readonly fileCount: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly durationMs: number;
  readonly sizeBytes: number;
  readonly status: string;
  readonly stages: readonly BuildStageResult[];
}
export interface DeploymentReport {
  readonly id: string;
  readonly buildId: string;
  readonly projectId: string;
  readonly internalUrl: string;
  readonly deployedAt: number;
  readonly notes?: string;
}
