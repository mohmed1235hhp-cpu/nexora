import type { IBuildEngine } from '../interfaces/IBuildEngine.js';
import { BuildWorker } from './worker.js';
import { WorkerRegistry } from './worker-registry.js';

export interface WorkerPoolOptions { readonly size: number; }
export class WorkerPool {
  readonly registry = new WorkerRegistry();
  constructor(engine: IBuildEngine, opts: WorkerPoolOptions) {
    for (let i = 0; i < opts.size; i += 1) this.registry.register(new BuildWorker(engine, `worker-${i}`));
  }
  pickIdle() { return this.registry.list().find(w => w.info().status === 'idle'); }
  size(): number { return this.registry.list().length; }
}
