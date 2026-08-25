export class LatencyTracker {
  private samples: number[] = [];
  record(ms: number): void {
    this.samples.push(ms);
    if (this.samples.length > 500) this.samples.shift();
  }
  average(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }
}
