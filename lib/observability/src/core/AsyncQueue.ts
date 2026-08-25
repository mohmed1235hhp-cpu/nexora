/** Bounded async queue with back-pressure — used by log/metric batching. */
export class AsyncQueue<T> {
  private readonly buf: T[] = [];
  private closed = false;
  constructor(public readonly capacity = 1024) {}
  push(item: T): boolean {
    if (this.closed) return false;
    if (this.buf.length >= this.capacity) return false;
    this.buf.push(item);
    return true;
  }
  drain(): T[] { const out = this.buf.splice(0, this.buf.length); return out; }
  size(): number { return this.buf.length; }
  close(): void { this.closed = true; }
  get isClosed(): boolean { return this.closed; }
}
