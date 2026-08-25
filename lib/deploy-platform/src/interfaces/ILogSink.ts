import type { LogEntry } from '../utils/logger.js';
export interface ILogSink {
  write(entry: LogEntry): void;
  tail(scope: string, limit?: number): readonly LogEntry[];
}
