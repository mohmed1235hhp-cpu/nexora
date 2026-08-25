import type { LogFilter, LogRecord } from "../types.js";
/**
 * Redacts sensitive keys from `data`. Filter never drops records — it mutates
 * a shallow copy via write-through by returning true and letting the router
 * pass the sanitized record. The router calls transform() when supported.
 */
const DEFAULT_KEYS = ["password","token","secret","apiKey","api_key","authorization","cookie","session"];
export class RedactionFilter implements LogFilter {
  constructor(private readonly keys: readonly string[] = DEFAULT_KEYS) {}
  accept(_r: LogRecord): boolean { return true; }
  transform(r: LogRecord): LogRecord {
    if (!r.data) return r;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r.data)) {
      out[k] = this.keys.includes(k.toLowerCase()) ? "[REDACTED]" : v;
    }
    return { ...r, data: out as LogRecord["data"] };
  }
}
