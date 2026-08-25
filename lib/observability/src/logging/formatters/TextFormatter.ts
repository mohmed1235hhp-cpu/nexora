import type { LogFormatter, LogRecord } from "../types.js";
export class TextFormatter implements LogFormatter {
  format(r: LogRecord): string {
    const t = new Date(r.ts).toISOString();
    const ctx = r.context?.traceId ? ` trace=${r.context.traceId}` : "";
    return `${t} [${r.level.toUpperCase()}] (${r.category}/${r.domain})${ctx} ${r.message}`;
  }
}
