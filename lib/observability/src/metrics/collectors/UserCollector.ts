import type { MetricRegistry } from "../MetricRegistry.js";
export class UserCollector {
  constructor(private readonly reg: MetricRegistry, private readonly probe: () => Promise<number> | number, public readonly intervalMs = 15000) {}
  private handle: ReturnType<typeof setInterval> | null = null;
  start(): void {
    const g = this.reg.gauge("active_users");
    const tick = async () => g.set(await this.probe());
    void tick();
    this.handle = setInterval(() => { void tick(); }, this.intervalMs);
    (this.handle as unknown as { unref?: () => void }).unref?.();
  }
  stop(): void { if (this.handle) { clearInterval(this.handle); this.handle = null; } }
}
