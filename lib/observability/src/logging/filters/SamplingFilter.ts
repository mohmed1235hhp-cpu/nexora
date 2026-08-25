import type { LogFilter, LogRecord } from "../types.js";
export class SamplingFilter implements LogFilter {
  constructor(private readonly rate: number) {
    if (rate < 0 || rate > 1) throw new Error("SamplingFilter: rate must be in [0,1]");
  }
  accept(_r: LogRecord): boolean { return Math.random() < this.rate; }
}
