import type { LogEntry } from '../utils/logger.js';
export class LogStore {
  private entries: LogEntry[] = [];
  private cap = 10_000;
  append(entry: LogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.cap) this.entries.splice(0, this.entries.length - this.cap);
  }
  query(filter?: { scope?: string; sinceMs?: number }): readonly LogEntry[] {
    return this.entries.filter(e =>
      (!filter?.scope || (e.scope ?? '').startsWith(filter.scope)) &&
      (!filter?.sinceMs || e.ts >= filter.sinceMs)
    );
  }
}
