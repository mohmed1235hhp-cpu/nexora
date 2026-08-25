import type { BuildRequest, BuildResult } from '../types/build.js';
import type { WorkerInfo } from '../types/worker.js';
export interface IBuildWorker {
  info(): WorkerInfo;
  process(request: BuildRequest): Promise<BuildResult>;
  drain(): Promise<void>;
}
