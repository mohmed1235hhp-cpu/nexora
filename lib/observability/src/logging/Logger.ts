import type { Severity } from "../core/types.js";
import type { ObservabilityContext } from "../core/Context.js";
import { mergeContext } from "../core/Context.js";
import { defaultIdGenerator } from "../core/IdGenerator.js";
import { systemClock, type Clock } from "../core/Clock.js";
import type { LogRecord, LogSink, LogFilter, LogCategory } from "./types.js";
import { LogRouter } from "./LogRouter.js";
import { DEFAULT_LEVEL, isLevelEnabled } from "./LogLevel.js";
import type { ObservabilityDomain } from "../core/types.js";

export interface LoggerOptions {
  readonly minLevel?: Severity;
  readonly domain?:   ObservabilityDomain;
  readonly category?: LogCategory;
  readonly context?:  ObservabilityContext;
  readonly sinks:     readonly LogSink[];
  readonly filters?:  readonly LogFilter[];
  readonly clock?:    Clock;
}

export class Logger {
  private readonly router: LogRouter;
  private readonly minLevel: Severity;
  private readonly clock: Clock;
  private readonly baseCtx?: ObservabilityContext;
  private readonly domain: ObservabilityDomain;
  private readonly category: LogCategory;

  constructor(opts: LoggerOptions) {
    this.router   = new LogRouter(opts.sinks, opts.filters ?? []);
    this.minLevel = opts.minLevel ?? DEFAULT_LEVEL;
    this.clock    = opts.clock ?? systemClock;
    this.baseCtx  = opts.context;
    this.domain   = opts.domain   ?? "self";
    this.category = opts.category ?? "app";
  }

  child(overrides: Partial<Omit<LoggerOptions, "sinks" | "filters">> & { context?: ObservabilityContext }): Logger {
    return new Logger({
      sinks:    (this as unknown as { router: { sinks: readonly LogSink[] } }).router["sinks"] ?? [],
      filters:  [],
      minLevel: overrides.minLevel ?? this.minLevel,
      domain:   overrides.domain   ?? this.domain,
      category: overrides.category ?? this.category,
      context:  mergeContext(this.baseCtx, overrides.context),
      clock:    this.clock,
    });
  }

  debug   (m: string, d?: LogRecord["data"], c?: ObservabilityContext): Promise<void> { return this.log("debug", m, d, c); }
  info    (m: string, d?: LogRecord["data"], c?: ObservabilityContext): Promise<void> { return this.log("info", m, d, c); }
  notice  (m: string, d?: LogRecord["data"], c?: ObservabilityContext): Promise<void> { return this.log("notice", m, d, c); }
  warn    (m: string, d?: LogRecord["data"], c?: ObservabilityContext): Promise<void> { return this.log("warn", m, d, c); }
  error   (m: string, e?: unknown,           c?: ObservabilityContext): Promise<void> { return this.log("error", m, undefined, c, e); }
  critical(m: string, e?: unknown,           c?: ObservabilityContext): Promise<void> { return this.log("critical", m, undefined, c, e); }

  async log(
    level: Severity, message: string,
    data?: LogRecord["data"], context?: ObservabilityContext, error?: unknown,
  ): Promise<void> {
    if (!isLevelEnabled(this.minLevel, level)) return;
    const rec: LogRecord = {
      id: defaultIdGenerator.next("log"),
      ts: this.clock.now(),
      level, category: this.category, domain: this.domain,
      message,
      context: mergeContext(this.baseCtx, context),
      data,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : undefined,
    };
    await this.router.dispatch(rec);
  }
}
