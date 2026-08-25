import { LogFormatter } from "./LogFormatter";
import { MetricsCollector } from "./MetricsCollector";
import { TokenAccountant } from "./TokenAccountant";
import type { AIRequest } from "../types/request.types";
import type { AIResponse } from "../types/response.types";
import { db, aiAuditLogsTable } from "@workspace/db";

/**
 * Enterprise Logging (Upgrade STEP 9) — every provider call and failure is
 * persisted to `ai_audit_logs` (the same table the AI Governance admin
 * screens already read from), in addition to the existing console output.
 * DB writes are fire-and-forget: a logging failure must never break the
 * actual AI request it's describing, so errors here are swallowed after a
 * single console warning rather than propagated.
 */
export class AILogger {
  readonly formatter = new LogFormatter();
  readonly metrics = new MetricsCollector();
  readonly tokens = new TokenAccountant();

  logRequest(req: AIRequest, res: AIResponse): void {
    this.metrics.inc(`task.${req.task}`);
    if (res.usage) this.tokens.add(res.usage.promptTokens, res.usage.completionTokens);
    // eslint-disable-next-line no-console
    console.debug(this.formatter.formatRequest(req), this.formatter.formatResponse(res));
    void this.persist(req, res.ok ? "send_message" : "provider_error", res);
  }

  logError(req: AIRequest, err: Error): void {
    this.metrics.inc("errors");
    // eslint-disable-next-line no-console
    console.warn(this.formatter.formatRequest(req), "error:", err.message);
    void this.persist(req, "provider_error", undefined, err.message);
  }

  private async persist(req: AIRequest, action: string, res?: AIResponse, errorMessage?: string): Promise<void> {
    const userIdNum = req.meta?.userId ? Number(req.meta.userId) : NaN;
    try {
      await db.insert(aiAuditLogsTable).values({
        userId: Number.isFinite(userIdNum) ? userIdNum : null,
        action,
        model: res?.providerId ?? res?.modelId ?? "unknown",
        tokensUsed: res?.usage?.totalTokens ?? 0,
        costUsd: res?.usage?.costUsd ?? 0,
        metadata: JSON.stringify({ task: req.task, requestId: req.meta?.requestId, errorMessage }),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[AILogger] failed to persist audit log:", err instanceof Error ? err.message : err);
    }
  }
}
