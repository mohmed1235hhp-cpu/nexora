export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  constructor(private threshold = 5, private cooldownMs = 30_000) {}

  isOpen(): boolean {
    if (this.failures < this.threshold) return false;
    if (Date.now() - this.openedAt > this.cooldownMs) {
      this.reset();
      return false;
    }
    return true;
  }
  recordSuccess(): void {
    this.failures = 0;
  }
  recordFailure(): void {
    this.failures++;
    if (this.failures >= this.threshold) this.openedAt = Date.now();
  }
  reset(): void {
    this.failures = 0;
    this.openedAt = 0;
  }
}
