import type { BuildRequest, BuildResult } from '../types/build.js';
export interface IWorkerScheduler {
  schedule(request: BuildRequest): Promise<BuildResult>;
  activeCount(): number;
}
