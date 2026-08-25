import type { Severity, Tags, Json, Timestamp, ObservabilityDomain } from "../core/types.js";
import type { ObservabilityContext } from "../core/Context.js";

export type LogLevel = Severity;
export type LogCategory = "app" | "audit" | "security" | "performance" | "ai" | "system";

export interface LogRecord {
  readonly id: string;
  readonly ts: Timestamp;
  readonly level: LogLevel;
  readonly category: LogCategory;
  readonly domain: ObservabilityDomain;
  readonly message: string;
  readonly context?: ObservabilityContext;
  readonly data?: Readonly<Record<string, Json>>;
  readonly tags?: Tags;
  readonly error?: { name: string; message: string; stack?: string };
}

export interface LogSink {
  readonly name: string;
  write(record: LogRecord): void | Promise<void>;
  flush?(): void | Promise<void>;
  close?(): void | Promise<void>;
}

export interface LogFormatter {
  format(record: LogRecord): string;
}

export interface LogFilter {
  /** Returns true when the record should be forwarded. */
  accept(record: LogRecord): boolean;
}
