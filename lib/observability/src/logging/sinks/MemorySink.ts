import type { LogSink, LogRecord } from "../types.js";
export class MemorySink implements LogSink {
  readonly name = "memory";
  private readonly buffer: LogRecord[] = [];
  constructor(public readonly capacity = 5000) {}
  write(record: LogRecord): void {
    this.buffer.push(record);
    if (this.buffer.length > this.capacity) this.buffer.shift();
  }
  snapshot(): readonly LogRecord[] { return this.buffer.slice(); }
  clear(): void { this.buffer.length = 0; }
  size(): number { return this.buffer.length; }
}
