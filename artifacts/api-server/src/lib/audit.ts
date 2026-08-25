/**
 * Structured audit logging for sensitive operations.
 * Emits to the main logger with a stable `audit: true` marker so it can be
 * routed to a dedicated log sink or SIEM.
 */
import type { Request } from "express";
import { logger } from "./logger";

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.register"
  | "auth.password_change"
  | "auth.password_reset"
  | "user.role_change"
  | "user.ban"
  | "user.unban"
  | "user.delete"
  | "content.delete"
  | "content.moderate"
  | "report.create"
  | "report.resolve"
  | "admin.action";

export interface AuditContext {
  actorId?: number | null;
  targetId?: number | null;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
}

export function audit(action: AuditAction, ctx: AuditContext = {}): void {
  logger.info(
    {
      audit: true,
      action,
      actorId: ctx.actorId ?? null,
      targetId: ctx.targetId ?? null,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      ...ctx.meta,
    },
    `audit:${action}`,
  );
}

export function auditFromRequest(
  req: Request,
  action: AuditAction,
  extra: Omit<AuditContext, "ip" | "userAgent"> = {},
): void {
  audit(action, {
    ...extra,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
}
