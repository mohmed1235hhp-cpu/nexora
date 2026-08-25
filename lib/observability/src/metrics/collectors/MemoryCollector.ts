import type { MetricRegistry } from "../MetricRegistry.js";
export class MemoryCollector {
  constructor(private readonly reg: MetricRegistry, public readonly intervalMs = 5000) {}
  private handle: ReturnType<typeof setInterval> | null = null;
  start(): void {
    const rss  = this.reg.gauge("process_memory_rss_bytes",  "Resident set size in bytes");
    const heap = this.reg.gauge("process_memory_heap_bytes", "Heap used in bytes");
    const tick = () => {
      if (typeof process === "undefined" || !process.memoryUsage) return;
      const mu = process.memoryUsage();
      rss.set(mu.rss); heap.set(mu.heapUsed);
    };
    tick();
    this.handle = setInterval(tick, this.intervalMs);
    (this.handle as unknown as { unref?: () => void }).unref?.();
  }
  stop(): void { if (this.handle) { clearInterval(this.handle); this.handle = null; } }
}
