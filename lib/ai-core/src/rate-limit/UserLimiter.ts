export class UserLimiter {
  private counts = new Map<string, number[]>();
  constructor(private limitPerMinute = 60) {}
  allow(userId: string): boolean {
    const now = Date.now();
    const arr = (this.counts.get(userId) ?? []).filter((t) => now - t < 60_000);
    if (arr.length >= this.limitPerMinute) return false;
    arr.push(now);
    this.counts.set(userId, arr);
    return true;
  }
}
