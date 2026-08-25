import type { BuildRequest, BuildResult } from '../types/build.js';
export interface ITaskDispatcher {
  submit(request: BuildRequest): Promise<BuildResult>;
  cancel(buildId: string): Promise<boolean>;
}
