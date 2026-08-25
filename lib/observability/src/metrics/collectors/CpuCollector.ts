import type { MetricRegistry } from "../MetricRegistry.js";
export class CpuCollector {
  constructor(private readonly reg: MetricRegistry, public readonly intervalMs = 5000) {}
  private handle: ReturnType<typeof setInterval> | null = null;
  private last?: { user: number; system: number; at: number };
  start(): void {
    const g = this.reg.gauge("process_cpu_pct", "Process CPU utilisation (0-100)");
    const tick = () => {
      if (typeof process === "undefined" || !process.cpuUsage) return;
      const cu = process.cpuUsage(); const at = Date.now();
      if (!this.last) { this.last = { user: cu.user, system: cu.system, at }; return; }
      const elapsedUs = (at - this.last.at) * 1000;
      const usedUs    = (cu.user - this.last.user) + (cu.system - this.last.system);
      const pct = elapsedUs > 0 ? Math.min(100, (usedUs / elapsedUs) * 100) : 0;
      this.last = { user: cu.user, system: cu.system, at };
      g.set(pct);
    };
    tick();
    this.handle = setInterval(tick, this.intervalMs);
    (this.handle as unknown as { unref?: () => void }).unref?.();
  }
  stop(): void { if (this.handle) { clearInterval(this.handle); this.handle = null; } }
}
