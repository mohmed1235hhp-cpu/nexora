import type { IHealthMonitor, HealthSample } from '../interfaces/IHealthMonitor.js';
export class ServerHealthMonitorPlaceholder implements IHealthMonitor<string> {
  private samples = new Map<string, HealthSample[]>();
  async probe(id: string): Promise<HealthSample> {
    const s: HealthSample = { ts: Date.now(), ok: true, detail: 'placeholder' };
    const arr = this.samples.get(id) ?? [];
    arr.push(s);
    this.samples.set(id, arr.slice(-100));
    return s;
  }
  recent(id: string, limit = 20): readonly HealthSample[] {
    return (this.samples.get(id) ?? []).slice(-limit);
  }
}
