import type { LogEntry } from "./StructuredLogger";
export interface LogStore {
  append(entry: LogEntry): Promise<void> | void;
  list(jobId: string): Promise<LogEntry[]> | LogEntry[];
}
export class InMemoryLogStore implements LogStore {
  private data = new Map<string, LogEntry[]>();
  append(e: LogEntry) {
    const arr = this.data.get(e.jobId) ?? [];
    arr.push(e); this.data.set(e.jobId, arr);
  }
  list(jobId: string) { return this.data.get(jobId) ?? []; }
}
