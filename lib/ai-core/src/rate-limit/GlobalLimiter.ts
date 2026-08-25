export class GlobalLimiter {
  private events: number[] = [];
  constructor(private limitPerMinute = 600) {}
  allow(): boolean {
    const now = Date.now();
    this.events = this.events.filter((t) => now - t < 60_000);
    if (this.events.length >= this.limitPerMinute) return false;
    this.events.push(now);
    return true;
  }
}
