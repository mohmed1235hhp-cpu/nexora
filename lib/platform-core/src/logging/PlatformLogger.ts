/**
 * Central structured logger for the platform.
 * Records every operation: requestId, taskId, agentId, timings, errors.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogRecord {
  readonly ts: number;
  readonly level: LogLevel;
  readonly scope: string;
  readonly msg: string;
  readonly ctx?: Readonly<Record<string, unknown>>;
}

export interface ILogSink {
  write(rec: LogRecord): void;
}

export class ConsoleSink implements ILogSink {
  write(rec: LogRecord): void {
    const line = `[${new Date(rec.ts).toISOString()}] ${rec.level.toUpperCase()} ${rec.scope} — ${rec.msg}`;
    if (rec.level === "error") console.error(line, rec.ctx ?? {});
    else if (rec.level === "warn") console.warn(line, rec.ctx ?? {});
    else console.log(line, rec.ctx ?? {});
  }
}

export class MemorySink implements ILogSink {
  private buf: LogRecord[] = [];
  private readonly cap: number;
  constructor(cap = 5000) {
    this.cap = cap;
  }
  write(rec: LogRecord): void {
    if (this.buf.length >= this.cap) this.buf.shift();
    this.buf.push(rec);
  }
  snapshot(): readonly LogRecord[] {
    return this.buf.slice();
  }
  clear(): void {
    this.buf.length = 0;
  }
}

export class PlatformLogger {
  constructor(private readonly sinks: readonly ILogSink[]) {}

  private emit(level: LogLevel, scope: string, msg: string, ctx?: Record<string, unknown>): void {
    const rec: LogRecord = { ts: Date.now(), level, scope, msg, ctx };
    for (const s of this.sinks) {
      try {
        s.write(rec);
      } catch {
        /* never throw from logging */
      }
    }
  }

  debug(scope: string, msg: string, ctx?: Record<string, unknown>): void {
    this.emit("debug", scope, msg, ctx);
  }
  info(scope: string, msg: string, ctx?: Record<string, unknown>): void {
    this.emit("info", scope, msg, ctx);
  }
  warn(scope: string, msg: string, ctx?: Record<string, unknown>): void {
    this.emit("warn", scope, msg, ctx);
  }
  error(scope: string, msg: string, ctx?: Record<string, unknown>): void {
    this.emit("error", scope, msg, ctx);
  }

  child(scope: string): ScopedLogger {
    return new ScopedLogger(this, scope);
  }
}

export class ScopedLogger {
  constructor(private readonly root: PlatformLogger, private readonly scope: string) {}
  debug(msg: string, ctx?: Record<string, unknown>): void {
    this.root.debug(this.scope, msg, ctx);
  }
  info(msg: string, ctx?: Record<string, unknown>): void {
    this.root.info(this.scope, msg, ctx);
  }
  warn(msg: string, ctx?: Record<string, unknown>): void {
    this.root.warn(this.scope, msg, ctx);
  }
  error(msg: string, ctx?: Record<string, unknown>): void {
    this.root.error(this.scope, msg, ctx);
  }
}
