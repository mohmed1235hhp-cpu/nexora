import type { ILogSink } from '../interfaces/ILogSink.js';
import type { LogEntry } from '../utils/logger.js';
export class InMemoryLogSink implements ILogSink {
  private entries: LogEntry[] = [];
  private cap = 5000;
  write(entry: LogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.cap) this.entries.splice(0, this.entries.length - this.cap);
  }
  tail(scope: string, limit = 100): readonly LogEntry[] {
    return this.entries.filter(e => (e.scope ?? '').startsWith(scope)).slice(-limit);
  }
}
