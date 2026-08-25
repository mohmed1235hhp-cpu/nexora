import type { WorkerRegistry } from './worker-registry.js';
export class WorkerMonitor {
  constructor(private registry: WorkerRegistry) {}
  summary() {
    const infos = this.registry.snapshot();
    return {
      total: infos.length,
      idle: infos.filter(i => i.status === 'idle').length,
      busy: infos.filter(i => i.status === 'busy').length,
      down: infos.filter(i => i.status === 'down').length,
      processed: infos.reduce((n, i) => n + i.processed, 0),
      failed: infos.reduce((n, i) => n + i.failed, 0),
    };
  }
}
