export interface LogEntry {
  jobId: string;
  ts: number;
  level: "info" | "warn" | "error";
  message: string;
  meta?: unknown;
}

export class StructuredLogger {
  private store = new Map<string, LogEntry[]>();
  push(jobId: string, level: LogEntry["level"], message: string, meta?: unknown) {
    const arr = this.store.get(jobId) ?? [];
    arr.push({ jobId, ts: Date.now(), level, message, meta });
    this.store.set(jobId, arr);
  }
  read(jobId: string): LogEntry[] { return this.store.get(jobId) ?? []; }
  clear(jobId: string) { this.store.delete(jobId); }
}

export const globalLogger = new StructuredLogger();
