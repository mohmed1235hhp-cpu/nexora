import type { Histogram } from "./Histogram.js";
export class Timer {
  constructor(private readonly hist: Histogram, private readonly start = performance.now()) {}
  stop(): number { const d = performance.now() - this.start; this.hist.observe(d); return d; }
  static start(hist: Histogram): Timer { return new Timer(hist); }
}
