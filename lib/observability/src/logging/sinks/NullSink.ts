import type { LogSink } from "../types.js";
export class NullSink implements LogSink {
  readonly name = "null";
  write(): void { /* discard */ }
}
