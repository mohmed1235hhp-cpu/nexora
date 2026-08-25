import { Logger } from "./Logger.js";
import type { LoggerOptions } from "./Logger.js";
import type { ObservabilityContext } from "../core/Context.js";

export type AuditAction =
  | "login" | "logout" | "permission_change" | "project_create" | "project_delete"
  | "deployment" | "credit_change" | "premium_change" | "agent_action" | "build" | "admin_action";

export class AuditLogger {
  private readonly base: Logger;
  constructor(opts: LoggerOptions) {
    this.base = new Logger({ ...opts, category: "audit" });
  }
  record(action: AuditAction, detail: Record<string, string | number | boolean>, ctx?: ObservabilityContext): Promise<void> {
    return this.base.log("notice", `audit:${action}`, { action, ...detail }, ctx);
  }
}
