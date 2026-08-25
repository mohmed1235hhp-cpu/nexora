import type { LogFilter, LogRecord } from "../types.js";
import { isLevelEnabled } from "../LogLevel.js";
import type { Severity } from "../../core/types.js";
export class LevelFilter implements LogFilter {
  constructor(private readonly min: Severity) {}
  accept(r: LogRecord): boolean { return isLevelEnabled(this.min, r.level); }
}
