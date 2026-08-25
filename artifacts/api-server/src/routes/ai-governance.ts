/**
 * Phase 23 — AI Governance
 * AI Provider Management, Model Switching, Token Usage, Cost Monitoring,
 * Rate Limits, User Quotas, Conversation History, Prompt Safety,
 * Output Moderation, AI Analytics, AI Quality Evaluation, AI Audit Logs
 */
import { Router, Response } from "express";
import { db, aiGovernanceProvidersTable, aiConversationsTable, aiMessagesTable, aiAuditLogsTable, auditLogsTable } from "@workspace/db";
import { eq, desc, sql, gte, and } from "drizzle-orm";
import { asyncHandler, ValidationError, NotFoundError, ForbiddenError, RateLimitError } from "@workspace/core/errors";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";
import { createRateLimiter } from "../middlewares/rateLimit";
import { encrypt } from "../lib/crypto";
import { parseIdParam } from "../lib/helpers";
import { getAIRouter, TaskType } from "@workspace/ai-core";

const router = Router();

// Rate limiter: 50 AI requests per minute per user
const aiLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 50,
  keyPrefix: "ai",
  message: "AI request limit reached. Please wait before sending more requests.",
});

// Prompt safety: list of blocked patterns (extend as needed)
const BLOCKED_PATTERNS = [
  /\bignore previous instructions?\b/i,
  /\bjailbreak\b/i,
  /\bprompt injection\b/i,
  /\bsystem prompt\b/i,
  /\byou are now\b/i,
  /\bact as (if you were|a)?\b/i,
  /\bforget (all )?(your|previous) (instructions?|training|rules?)\b/i,
];

function checkPromptSafety(prompt: string): { safe: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      return { safe: false, reason: "Prompt contains potentially unsafe content" };
    }
  }
  if (prompt.length > 10_000) {
    return { safe: false, reason: "Prompt exceeds maximum length (10,000 characters)" };
  }
  return { safe: true };
}

// ─── Provider Management (Admin only) ─────────────────────────────────────────

// GET /api/ai/providers — list all AI providers
router.get("/providers", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const providers = await db.select().from(aiGovernanceProvidersTable)
    .orderBy(aiGovernanceProvidersTable.name);

  // Never expose API keys in responses
  const sanitized = providers.map(p => ({
    id: p.id,
    name: p.name,
    displayName: p.displayName,
    isActive: p.isActive,
    models: p.models,
    defaultModel: p.defaultModel,
    rateLimit: p.rateLimit,
    costPerToken: p.costPerToken,
    totalTokensUsed: p.totalTokensUsed,
    totalCostUsd: p.totalCostUsd,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  res.json(sanitized);
}));

// POST /api/ai/providers — create provider (super_admin only)
router.post("/providers", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.userRole !== "super_admin") {
    throw new ForbiddenError("Super Admin only");
  }

  const { name, displayName, apiKey, models, defaultModel, rateLimit, costPerToken } = req.body;
  if (!name || !displayName || !apiKey) {
    throw new ValidationError("name, displayName, and apiKey are required");
  }

  const [provider] = await db.insert(aiGovernanceProvidersTable).values({
    name,
    displayName,
    // SECURITY: this column is named apiKeyEncrypted but was previously
    // storing the raw key — genuinely encrypt it now with the existing
    // AES-256-GCM helper (see lib/crypto.ts) instead of leaving it plaintext.
    apiKeyEncrypted: encrypt(apiKey),
    models: models ?? [],
    defaultModel: defaultModel ?? null,
    rateLimit: rateLimit ?? 1000,
    costPerToken: costPerToken ?? 0.00001,
  }).returning({
    id: aiGovernanceProvidersTable.id,
    name: aiGovernanceProvidersTable.name,
    displayName: aiGovernanceProvidersTable.displayName,
  });

  await db.insert(auditLogsTable).values({
    userId: req.userId!,
    action: "create_ai_provider",
    resourceType: "ai_provider",
    resourceId: provider.id,
    metadata: JSON.stringify({ name }),
    ipAddress: req.ip,
  });

  res.status(201).json(provider);
}));

// PATCH /api/ai/providers/:id — update provider
router.patch("/providers/:id", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.userRole !== "super_admin") {
    throw new ForbiddenError("Super Admin only");
  }

  const id = parseIdParam(req.params.id, "id");
  const { isActive, models, defaultModel, rateLimit, costPerToken } = req.body;

  const updates: Record<string, unknown> = {};
  if (typeof isActive === "boolean") updates.isActive = isActive;
  if (models !== undefined) updates.models = models;
  if (defaultModel !== undefined) updates.defaultModel = defaultModel;
  if (rateLimit !== undefined) updates.rateLimit = rateLimit;
  if (costPerToken !== undefined) updates.costPerToken = costPerToken;

  await db.update(aiGovernanceProvidersTable).set(updates).where(eq(aiGovernanceProvidersTable.id, id));

  await db.insert(auditLogsTable).values({
    userId: req.userId!,
    action: "update_ai_provider",
    resourceType: "ai_provider",
    resourceId: id,
    metadata: JSON.stringify(updates),
    ipAddress: req.ip,
  });

  res.json({ message: "Provider updated" });
}));

// ─── User Quota Management ──────────────────────────────────────────────────

// GET /api/ai/quota — get current user's quota
router.get("/quota", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usedToday = await db.select({ total: sql<number>`coalesce(sum(tokens_used), 0)` })
    .from(aiMessagesTable)
    .where(and(eq(aiMessagesTable.userId, req.userId!), gte(aiMessagesTable.createdAt, today)));

  const DAILY_QUOTA = 50_000; // tokens per day per user (configurable via feature flags)
  const used = Number(usedToday[0]?.total ?? 0);

  res.json({
    dailyQuota: DAILY_QUOTA,
    used,
    remaining: Math.max(0, DAILY_QUOTA - used),
    resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  });
}));

// ─── Conversation History ────────────────────────────────────────────────────

// GET /api/ai/conversations — list user's AI conversations
router.get("/conversations", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const conversations = await db.select().from(aiConversationsTable)
    .where(eq(aiConversationsTable.userId, req.userId!))
    .orderBy(desc(aiConversationsTable.updatedAt))
    .limit(limit).offset(offset);

  res.json({ conversations, total: conversations.length, page, limit });
}));

// POST /api/ai/conversations — create new conversation
router.post("/conversations", requireAuth, aiLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, model, provider } = req.body;

  const [conv] = await db.insert(aiConversationsTable).values({
    userId: req.userId!,
    title: title ?? "New Conversation",
    model: model ?? "gpt-4o-mini",
    provider: provider ?? "openai",
  }).returning();

  res.status(201).json(conv);
}));

// GET /api/ai/conversations/:id/messages — get messages for a conversation
router.get("/conversations/:id/messages", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");

  // Verify ownership
  const conv = await db.select().from(aiConversationsTable)
    .where(and(eq(aiConversationsTable.id, id), eq(aiConversationsTable.userId, req.userId!)))
    .limit(1);

  if (!conv.length) {
    throw new NotFoundError("Conversation not found");
  }

  const messages = await db.select().from(aiMessagesTable)
    .where(eq(aiMessagesTable.conversationId, id))
    .orderBy(aiMessagesTable.createdAt);

  res.json({ messages, conversationId: id });
}));

// POST /api/ai/conversations/:id/messages — send message (with safety check)
router.post("/conversations/:id/messages", requireAuth, aiLimiter, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");
  const { content, role = "user" } = req.body;

  if (!content?.trim()) {
    throw new ValidationError("Message content required");
  }

  // Prompt safety check
  if (role === "user") {
    const safety = checkPromptSafety(content);
    if (!safety.safe) {
      await db.insert(aiAuditLogsTable).values({
        userId: req.userId!,
        conversationId: id,
        action: "prompt_blocked",
        model: "N/A",
        tokensUsed: 0,
        costUsd: 0,
        metadata: JSON.stringify({ reason: safety.reason }),
        ipAddress: req.ip,
      });

      throw new ValidationError(safety.reason ?? "Prompt rejected");
    }
  }

  // Verify conversation ownership
  const conv = await db.select().from(aiConversationsTable)
    .where(and(eq(aiConversationsTable.id, id), eq(aiConversationsTable.userId, req.userId!)))
    .limit(1);

  if (!conv.length) {
    throw new NotFoundError("Conversation not found");
  }

  // Daily quota check
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const usedToday = await db.select({ total: sql<number>`coalesce(sum(tokens_used), 0)` })
    .from(aiMessagesTable)
    .where(and(eq(aiMessagesTable.userId, req.userId!), gte(aiMessagesTable.createdAt, today)));

  const DAILY_QUOTA = 50_000;
  if (Number(usedToday[0]?.total ?? 0) >= DAILY_QUOTA) {
    throw new RateLimitError("Daily AI token quota exceeded. Resets at midnight.");
  }

  // Estimate tokens (rough: 1 token ≈ 4 chars)
  const estimatedTokens = Math.ceil(content.length / 4);

  const [message] = await db.insert(aiMessagesTable).values({
    conversationId: id,
    userId: req.userId!,
    role: role as "user" | "assistant" | "system",
    content,
    model: conv[0].model,
    provider: conv[0].provider,
    tokensUsed: estimatedTokens,
  }).returning();

  // Log AI action for audit
  await db.insert(aiAuditLogsTable).values({
    userId: req.userId!,
    conversationId: id,
    action: "send_message",
    model: conv[0].model,
    tokensUsed: estimatedTokens,
    costUsd: estimatedTokens * 0.00001,
    metadata: JSON.stringify({ role }),
    ipAddress: req.ip,
  });

  // Update conversation timestamp
  await db.update(aiConversationsTable)
    .set({ updatedAt: new Date(), totalTokens: sql`${aiConversationsTable.totalTokens} + ${estimatedTokens}` })
    .where(eq(aiConversationsTable.id, id));

  res.status(201).json(message);
}));

// DELETE /api/ai/conversations/:id — delete conversation
router.delete("/conversations/:id", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseIdParam(req.params.id, "id");

  const conv = await db.select({ id: aiConversationsTable.id }).from(aiConversationsTable)
    .where(and(eq(aiConversationsTable.id, id), eq(aiConversationsTable.userId, req.userId!)))
    .limit(1);

  if (!conv.length) {
    throw new NotFoundError("Conversation not found");
  }

  await db.delete(aiConversationsTable).where(eq(aiConversationsTable.id, id));
  res.json({ message: "Conversation deleted" });
}));

// ─── AI Analytics (Admin) ─────────────────────────────────────────────────────

// GET /api/ai/analytics — AI usage analytics for admins
router.get("/analytics", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const days = Math.min(90, parseInt(req.query.days as string) || 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalConversations, totalMessages, tokenUsage, modelBreakdown] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(aiConversationsTable)
      .where(gte(aiConversationsTable.createdAt, since)),
    db.select({ count: sql<number>`count(*)` }).from(aiMessagesTable)
      .where(gte(aiMessagesTable.createdAt, since)),
    db.select({ total: sql<number>`coalesce(sum(tokens_used), 0)`, cost: sql<number>`coalesce(sum(cost_usd), 0)` })
      .from(aiMessagesTable)
      .where(gte(aiMessagesTable.createdAt, since)),
    db.select({
      model: aiMessagesTable.model,
      count: sql<number>`count(*)`,
      tokens: sql<number>`sum(tokens_used)`,
    })
      .from(aiMessagesTable)
      .where(gte(aiMessagesTable.createdAt, since))
      .groupBy(aiMessagesTable.model),
  ]);

  res.json({
    period: `${days}d`,
    totalConversations: Number(totalConversations[0]?.count ?? 0),
    totalMessages: Number(totalMessages[0]?.count ?? 0),
    totalTokens: Number(tokenUsage[0]?.total ?? 0),
    totalCostUsd: Number(tokenUsage[0]?.cost ?? 0).toFixed(4),
    modelBreakdown: modelBreakdown.map(m => ({
      model: m.model,
      count: Number(m.count),
      tokens: Number(m.tokens),
    })),
  });
}));

// GET /api/ai/audit-logs — AI audit logs for admins
router.get("/audit-logs", requireAuth, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
  const offset = (page - 1) * limit;

  const logs = await db.select().from(aiAuditLogsTable)
    .orderBy(desc(aiAuditLogsTable.createdAt))
    .limit(limit).offset(offset);

  const totalR = await db.select({ count: sql<number>`count(*)` }).from(aiAuditLogsTable);

  res.json({ logs, total: Number(totalR[0]?.count ?? 0), page, limit });
}));

// POST /api/ai/feedback/:messageId — quality evaluation
router.post("/feedback/:messageId", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const messageId = parseIdParam(req.params.messageId, "messageId");
  const { rating, feedback } = req.body;

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    throw new ValidationError("Rating must be 1-5");
  }

  const message = await db.select().from(aiMessagesTable)
    .where(and(eq(aiMessagesTable.id, messageId), eq(aiMessagesTable.userId, req.userId!)))
    .limit(1);

  if (!message.length) {
    throw new NotFoundError("Message not found");
  }

  await db.update(aiMessagesTable)
    .set({ rating, feedback: feedback ?? null })
    .where(eq(aiMessagesTable.id, messageId));

  res.json({ message: "Feedback recorded" });
}));

// GET /api/ai/dashboard — Phase 2 Monitoring Dashboard requirement:
// current/fallback provider health, daily usage, cost, average response
// time, and error rate, sourced live from the shared Provider Manager
// (@workspace/ai-core) rather than a separate tracking system.
router.get("/dashboard", requireAuth, requireAdmin, asyncHandler(async (_req: AuthRequest, res: Response) => {
  const aiRouter = getAIRouter();
  const [health, snapshot] = await Promise.all([
    aiRouter.providers.health.checkAll(),
    Promise.resolve(aiRouter.monitor.snapshot()),
  ]);

  const capabilities = Object.values(TaskType).map((task) => ({
    capability: task,
    chain: aiRouter.providers.capabilities.providersFor(task),
  }));

  res.json({
    summary: {
      requests: snapshot.requests,
      successRate: snapshot.successRate,
      failureRate: snapshot.failureRate,
      averageLatencyMs: snapshot.averageLatencyMs,
      totalCostUsd: snapshot.totalCostUsd,
    },
    providers: snapshot.providers,
    providerHealth: health,
    routing: capabilities,
  });
}));

export default router;
