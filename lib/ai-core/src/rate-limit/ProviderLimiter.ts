export class ProviderLimiter {
  private counts = new Map<string, number[]>();
  constructor(private limitPerMinute = 240) {}
  allow(providerId: string): boolean {
    const now = Date.now();
    const arr = (this.counts.get(providerId) ?? []).filter((t) => now - t < 60_000);
    if (arr.length >= this.limitPerMinute) return false;
    arr.push(now);
    this.counts.set(providerId, arr);
    return true;
  }
}
