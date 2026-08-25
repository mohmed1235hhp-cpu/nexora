import type { LoggerOptions } from "./Logger.js";
import { Logger } from "./Logger.js";
import { ConsoleSink } from "./sinks/ConsoleSink.js";
import { MemorySink } from "./sinks/MemorySink.js";
import { MulticastSink } from "./sinks/MulticastSink.js";
import { JsonFormatter } from "./formatters/JsonFormatter.js";

export interface FactoryOptions extends Partial<LoggerOptions> {
  readonly withConsole?: boolean;
  readonly withMemory?:  boolean;
}
export class LoggerFactory {
  readonly memory = new MemorySink(2000);
  private readonly rootSinks;

  constructor(opts: FactoryOptions = {}) {
    const sinks = [];
    if (opts.withConsole ?? true) sinks.push(new ConsoleSink(new JsonFormatter()));
    if (opts.withMemory  ?? true) sinks.push(this.memory);
    if (opts.sinks?.length) sinks.push(...opts.sinks);
    this.rootSinks = [new MulticastSink(sinks)];
  }

  create(opts: Partial<LoggerOptions> = {}): Logger {
    return new Logger({ ...opts, sinks: this.rootSinks });
  }
}
