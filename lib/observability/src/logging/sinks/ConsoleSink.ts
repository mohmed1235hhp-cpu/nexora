import type { LogSink, LogRecord, LogFormatter } from "../types.js";
import { JsonFormatter } from "../formatters/JsonFormatter.js";
export class ConsoleSink implements LogSink {
  readonly name = "console";
  constructor(private readonly formatter: LogFormatter = new JsonFormatter()) {}
  write(record: LogRecord): void {
    const line = this.formatter.format(record);
    const lvl = record.level;
    if (lvl === "error" || lvl === "critical" || lvl === "alert" || lvl === "emergency") console.error(line);
    else if (lvl === "warn") console.warn(line);
    else if (lvl === "debug") console.debug(line);
    else console.log(line);
  }
}
