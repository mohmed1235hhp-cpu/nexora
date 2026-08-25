import type { LogSink, LogRecord } from "../types.js";
/** Batches writes to an underlying sink; flushes on interval or capacity. */
export class BufferedSink implements LogSink {
  readonly name: string;
  private buf: LogRecord[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  constructor(
    private readonly target: LogSink,
    public readonly capacity = 100,
    public readonly intervalMs = 1000,
  ) {
    this.name = `buffered(${target.name})`;
    this.timer = setInterval(() => { void this.flush(); }, this.intervalMs);
    (this.timer as unknown as { unref?: () => void }).unref?.();
  }
  write(record: LogRecord): void {
    this.buf.push(record);
    if (this.buf.length >= this.capacity) void this.flush();
  }
  async flush(): Promise<void> {
    if (this.buf.length === 0) return;
    const batch = this.buf.splice(0, this.buf.length);
    for (const rec of batch) await this.target.write(rec);
    await this.target.flush?.();
  }
  async close(): Promise<void> {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    await this.flush();
    await this.target.close?.();
  }
}
