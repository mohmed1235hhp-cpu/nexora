import { Logger } from "./Logger.js";
import type { LoggerOptions } from "./Logger.js";
import type { ObservabilityContext } from "../core/Context.js";
export class SecurityLogger {
  private readonly base: Logger;
  constructor(opts: LoggerOptions) { this.base = new Logger({ ...opts, category: "security" }); }
  event(kind: string, detail: Record<string, string | number | boolean>, ctx?: ObservabilityContext): Promise<void> {
    return this.base.log("warn", `security:${kind}`, { kind, ...detail }, ctx);
  }
  incident(kind: string, detail: Record<string, string | number | boolean>, ctx?: ObservabilityContext): Promise<void> {
    return this.base.log("critical", `security_incident:${kind}`, { kind, ...detail }, ctx);
  }
}
