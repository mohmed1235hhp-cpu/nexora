import type { BuildRequest, BuildResult, BuildStageName, BuildStageResult } from '../types/build.js';
export interface StageContext {
  readonly request: BuildRequest;
  readonly previous: readonly BuildStageResult[];
  readonly scratch: Map<string, unknown>;
}
export interface IStageExecutor {
  readonly name: BuildStageName;
  run(ctx: StageContext): Promise<BuildStageResult>;
}
export interface IBuildPipeline {
  execute(request: BuildRequest): Promise<BuildResult>;
  stages(): readonly BuildStageName[];
}
