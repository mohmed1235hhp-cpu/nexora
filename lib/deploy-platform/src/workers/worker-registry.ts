import type { IBuildWorker } from '../interfaces/IBuildWorker.js';
import type { WorkerInfo } from '../types/worker.js';
export class WorkerRegistry {
  private workers = new Map<string, IBuildWorker>();
  register(worker: IBuildWorker): void { this.workers.set(worker.info().id, worker); }
  deregister(id: string): boolean { return this.workers.delete(id); }
  get(id: string): IBuildWorker | undefined { return this.workers.get(id); }
  list(): readonly IBuildWorker[] { return [...this.workers.values()]; }
  snapshot(): readonly WorkerInfo[] { return this.list().map(w => w.info()); }
}
