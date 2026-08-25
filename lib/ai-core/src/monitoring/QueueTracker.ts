export class QueueTracker {
  private inFlight = 0;
  begin(): void {
    this.inFlight++;
  }
  end(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
  }
  size(): number {
    return this.inFlight;
  }
}
