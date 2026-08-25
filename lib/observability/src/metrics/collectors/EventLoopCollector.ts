import type { MetricRegistry } from "../MetricRegistry.js";
export class EventLoopCollector {
  constructor(private readonly reg: MetricRegistry, public readonly intervalMs = 1000) {}
  private handle: ReturnType<typeof setInterval> | null = null;
  private last = Date.now();
  start(): void {
    const g = this.reg.gauge("event_loop_lag_ms", "Approximate event loop lag");
    this.handle = setInterval(() => {
      const now = Date.now();
      const lag = now - this.last - this.intervalMs;
      this.last = now;
      g.set(Math.max(0, lag));
    }, this.intervalMs);
    (this.handle as unknown as { unref?: () => void }).unref?.();
  }
  stop(): void { if (this.handle) { clearInterval(this.handle); this.handle = null; } }
}
