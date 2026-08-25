export interface CpuReport { userMs: number; systemMs: number; loadAvg?: readonly number[]; }

export class CpuOptimizer {
  private readonly proc: any = (globalThis as any).process;
  private last = this.proc?.cpuUsage?.() ?? { user: 0, system: 0 };
  snapshot(): CpuReport {
    const cur = this.proc?.cpuUsage?.() ?? { user: 0, system: 0 };
    const diff = { user: cur.user - this.last.user, system: cur.system - this.last.system };
    this.last = cur;
    let loadAvg: number[] | undefined;
    try { loadAvg = (require("node:os") as typeof import("node:os")).loadavg(); } catch { /* ignore */ }
    return { userMs: diff.user / 1000, systemMs: diff.system / 1000, loadAvg };
  }
  /** Yield control on saturated event loop. */
  async yield(): Promise<void> { await new Promise<void>(r => setImmediate(r)); }
}
