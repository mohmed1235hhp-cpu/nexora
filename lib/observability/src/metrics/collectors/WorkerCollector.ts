import type { MetricRegistry } from "../MetricRegistry.js";
export interface WorkerSnapshot { total: number; busy: number; idle: number; failed: number; }
export class WorkerCollector {
  constructor(private readonly reg: MetricRegistry, private readonly probe: () => Promise<WorkerSnapshot> | WorkerSnapshot, public readonly intervalMs = 5000) {}
  private handle: ReturnType<typeof setInterval> | null = null;
  start(): void {
    const t = this.reg.gauge("workers_total");
    const b = this.reg.gauge("workers_busy");
    const i = this.reg.gauge("workers_idle");
    const f = this.reg.gauge("workers_failed");
    const tick = async () => { const s = await this.probe(); t.set(s.total); b.set(s.busy); i.set(s.idle); f.set(s.failed); };
    void tick();
    this.handle = setInterval(() => { void tick(); }, this.intervalMs);
    (this.handle as unknown as { unref?: () => void }).unref?.();
  }
  stop(): void { if (this.handle) { clearInterval(this.handle); this.handle = null; } }
}
