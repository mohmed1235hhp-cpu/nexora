import type { IWorkerScheduler } from '../interfaces/IWorkerScheduler.js';
import type { BuildRequest, BuildResult } from '../types/build.js';
import type { WorkerPool } from './worker-pool.js';

export class WorkerScheduler implements IWorkerScheduler {
  private active = 0;
  constructor(private pool: WorkerPool) {}
  activeCount(): number { return this.active; }
  async schedule(request: BuildRequest): Promise<BuildResult> {
    // Simple busy-wait for an idle worker (in-memory Phase 1).
    for (;;) {
      const worker = this.pool.pickIdle();
      if (worker) {
        this.active += 1;
        try { return await worker.process(request); }
        finally { this.active -= 1; }
      }
      await new Promise(r => setTimeout(r, 5));
    }
  }
}
