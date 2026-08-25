import { Logger } from "./Logger.js";
import type { LoggerOptions } from "./Logger.js";
export class PerformanceLogger {
  private readonly base: Logger;
  constructor(opts: LoggerOptions) { this.base = new Logger({ ...opts, category: "performance" }); }
  measure<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    const start = Date.now();
    const done = (extra?: Record<string, number>) =>
      this.base.info(`perf:${name}`, { name, durationMs: Date.now() - start, ...(extra ?? {}) });
    return Promise.resolve()
      .then(fn)
      .then(async (v) => { await done(); return v; })
      .catch(async (e) => { await done({ error: 1 }); throw e; });
  }
}
