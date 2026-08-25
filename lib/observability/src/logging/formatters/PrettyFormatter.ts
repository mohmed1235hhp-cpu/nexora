import type { LogFormatter, LogRecord } from "../types.js";
const COLOR: Record<string, string> = {
  debug: "\u001b[90m", info: "\u001b[36m", notice: "\u001b[34m",
  warn: "\u001b[33m", error: "\u001b[31m", critical: "\u001b[35m",
  alert: "\u001b[41m", emergency: "\u001b[41m", reset: "\u001b[0m",
};
export class PrettyFormatter implements LogFormatter {
  constructor(private readonly color = true) {}
  format(r: LogRecord): string {
    const c = this.color ? (COLOR[r.level] ?? "") : "";
    const z = this.color ? COLOR.reset : "";
    const t = new Date(r.ts).toISOString();
    return `${c}${t} ${r.level.padEnd(9)} ${r.domain}/${r.category}${z}  ${r.message}`;
  }
}
