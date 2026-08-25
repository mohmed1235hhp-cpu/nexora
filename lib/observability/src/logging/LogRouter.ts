import type { LogRecord, LogSink, LogFilter } from "./types.js";
import { RedactionFilter } from "./filters/RedactionFilter.js";
/** Applies filters (with optional transform) and fans out to sinks. */
export class LogRouter {
  constructor(
    private readonly sinks: readonly LogSink[],
    private readonly filters: readonly LogFilter[] = [],
  ) {}
  async dispatch(record: LogRecord): Promise<void> {
    let rec = record;
    for (const f of this.filters) {
      if (!f.accept(rec)) return;
      if (f instanceof RedactionFilter) rec = f.transform(rec);
    }
    for (const s of this.sinks) {
      try { await s.write(rec); }
      catch (e) { try { console.error("[LogRouter] sink error", s.name, e); } catch { /* ignore */ } }
    }
  }
}
