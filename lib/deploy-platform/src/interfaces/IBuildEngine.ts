import type { BuildRequest, BuildResult } from '../types/build.js';
export interface IBuildEngine {
  build(request: BuildRequest): Promise<BuildResult>;
}
