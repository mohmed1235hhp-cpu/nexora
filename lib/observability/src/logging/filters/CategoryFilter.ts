import type { LogFilter, LogRecord, LogCategory } from "../types.js";
export class CategoryFilter implements LogFilter {
  constructor(private readonly allow: readonly LogCategory[]) {}
  accept(r: LogRecord): boolean { return this.allow.includes(r.category); }
}
