import type { IHealthMonitor, HealthSample } from '../interfaces/IHealthMonitor.js';
import type { WorkerRegistry } from './worker-registry.js';

export class WorkerHealthChecker implements IHealthMonitor<string> {
  private samples = new Map<string, HealthSample[]>();
  constructor(private registry: WorkerRegistry) {}
  async probe(id: string): Promise<HealthSample> {
    const worker = this.registry.get(id);
    const sample: HealthSample = worker
      ? { ts: Date.now(), ok: worker.info().status !== 'down' }
      : { ts: Date.now(), ok: false, detail: 'not registered' };
    const arr = this.samples.get(id) ?? [];
    arr.push(sample);
    this.samples.set(id, arr.slice(-100));
    return sample;
  }
  recent(id: string, limit = 20): readonly HealthSample[] {
    return (this.samples.get(id) ?? []).slice(-limit);
  }
}
