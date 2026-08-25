import type { ProjectSource } from './project.js';

export type BuildStatus =
  | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export type BuildStageName =
  | 'receive' | 'validate' | 'install' | 'analyze' | 'compile'
  | 'bundle' | 'optimize' | 'review' | 'fix-errors' | 'test'
  | 'artifacts' | 'preview' | 'url' | 'report';

export interface BuildStageResult {
  readonly name: BuildStageName;
  readonly status: 'succeeded' | 'failed' | 'skipped';
  readonly startedAt: number;
  readonly endedAt: number;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly data?: Readonly<Record<string, unknown>>;
}

export interface BuildRequest {
  readonly id: string;
  readonly project: ProjectSource;
  readonly priority: 'low' | 'normal' | 'high' | 'premium';
  readonly requestedAt: number;
  readonly correlationId?: string;
}

export interface BuildResult {
  readonly id: string;
  readonly projectId: string;
  readonly status: BuildStatus;
  readonly stages: readonly BuildStageResult[];
  readonly startedAt: number;
  readonly endedAt: number;
  readonly artifactIds: readonly string[];
  readonly previewUrl?: string;
  readonly internalUrl?: string;
  readonly reportId?: string;
}
