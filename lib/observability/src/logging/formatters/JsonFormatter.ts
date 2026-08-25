import type { LogFormatter, LogRecord } from "../types.js";
export class JsonFormatter implements LogFormatter {
  format(r: LogRecord): string { return JSON.stringify(r); }
}
