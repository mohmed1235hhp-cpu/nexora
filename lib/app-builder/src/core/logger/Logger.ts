export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogEntry { level: LogLevel; msg: string; ts: number; ctx?: Record<string, unknown>; }
export class Logger {
  private buf: LogEntry[] = [];
  constructor(private tag = "app-builder") {}
  private push(level: LogLevel, msg: string, ctx?: Record<string, unknown>) {
    const entry = { level, msg, ts: Date.now(), ctx };
    this.buf.push(entry);
    if (this.buf.length > 500) this.buf.shift();
    // eslint-disable-next-line no-console
    console[level === "debug" ? "log" : level](`[${this.tag}] ${msg}`, ctx ?? "");
  }
  debug(m: string, c?: Record<string, unknown>){ this.push("debug", m, c); }
  info(m: string, c?: Record<string, unknown>){ this.push("info", m, c); }
  warn(m: string, c?: Record<string, unknown>){ this.push("warn", m, c); }
  error(m: string, c?: Record<string, unknown>){ this.push("error", m, c); }
  entries(): LogEntry[] { return [...this.buf]; }
}
export const logger = new Logger();
