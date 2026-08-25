import type { MetricRegistry } from "../MetricRegistry.js";
import { MemoryCollector } from "./MemoryCollector.js";
import { CpuCollector } from "./CpuCollector.js";
import { EventLoopCollector } from "./EventLoopCollector.js";
/** Aggregate host-level collectors (Memory + CPU + event loop). */
export class SystemCollector {
  private readonly mem: MemoryCollector;
  private readonly cpu: CpuCollector;
  private readonly loop: EventLoopCollector;
  constructor(reg: MetricRegistry, intervalMs = 5000) {
    this.mem  = new MemoryCollector(reg, intervalMs);
    this.cpu  = new CpuCollector(reg, intervalMs);
    this.loop = new EventLoopCollector(reg, 1000);
  }
  start(): void { this.mem.start(); this.cpu.start(); this.loop.start(); }
  stop():  void { this.mem.stop();  this.cpu.stop();  this.loop.stop();  }
}
