import type { MetricRegistry } from "../MetricRegistry.js";
export interface QueueSnapshot { pending: number; inFlight: number; failed: number; }
export class QueueCollector {
  constructor(private readonly reg: MetricRegistry, private readonly probe: () => Promise<QueueSnapshot> | QueueSnapshot, public readonly intervalMs = 5000) {}
  private handle: ReturnType<typeof setInterval> | null = null;
  start(): void {
    const p = this.reg.gauge("queue_pending",   "Jobs pending in queue");
    const f = this.reg.gauge("queue_in_flight", "Jobs currently processing");
    const x = this.reg.gauge("queue_failed",    "Jobs marked failed");
    const tick = async () => { const s = await this.probe(); p.set(s.pending); f.set(s.inFlight); x.set(s.failed); };
    void tick();
    this.handle = setInterval(() => { void tick(); }, this.intervalMs);
    (this.handle as unknown as { unref?: () => void }).unref?.();
  }
  stop(): void { if (this.handle) { clearInterval(this.handle); this.handle = null; } }
}
