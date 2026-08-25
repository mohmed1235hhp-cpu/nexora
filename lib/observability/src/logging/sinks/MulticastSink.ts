import type { LogSink, LogRecord } from "../types.js";
export class MulticastSink implements LogSink {
  readonly name = "multicast";
  constructor(private readonly sinks: readonly LogSink[]) {}
  async write(record: LogRecord): Promise<void> {
    for (const s of this.sinks) {
      try { await s.write(record); }
      catch (e) { try { console.error("[MulticastSink] sink failed", s.name, e); } catch { /* ignore */ } }
    }
  }
  async flush(): Promise<void> { for (const s of this.sinks) await s.flush?.(); }
  async close(): Promise<void> { for (const s of this.sinks) await s.close?.(); }
}
