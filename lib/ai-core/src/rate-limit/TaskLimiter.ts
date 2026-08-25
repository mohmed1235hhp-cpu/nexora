export class TaskLimiter {
  private counts = new Map<string, number[]>();
  constructor(private limitPerMinute = 120) {}
  allow(task: string): boolean {
    const now = Date.now();
    const arr = (this.counts.get(task) ?? []).filter((t) => now - t < 60_000);
    if (arr.length >= this.limitPerMinute) return false;
    arr.push(now);
    this.counts.set(task, arr);
    return true;
  }
}
