/**
 * Phase 23 — AI Governance Database Schema
 * Tables: AI providers, conversations, messages, audit logs
 */
import { pgTable, text, serial, timestamp, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// AI Provider management (OpenAI, Anthropic, Gemini, etc.)
export const aiGovernanceProvidersTable = pgTable("ai_governance_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // "openai", "anthropic", "gemini"
  displayName: text("display_name").notNull(),
  apiKeyEncrypted: text("api_key_encrypted").notNull(), // KMS-encrypted in production
  isActive: boolean("is_active").notNull().default(true),
  models: jsonb("models").notNull().default([]), // ["gpt-4o", "gpt-4o-mini"]
  defaultModel: text("default_model"),
  rateLimit: integer("rate_limit").notNull().default(1000), // requests per hour
  costPerToken: real("cost_per_token").notNull().default(0.00001),
  totalTokensUsed: integer("total_tokens_used").notNull().default(0),
  totalCostUsd: real("total_cost_usd").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// AI Conversations
export const aiConversationsTable = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New Conversation"),
  model: text("model").notNull().default("gpt-4o-mini"),
  provider: text("provider").notNull().default("openai"),
  totalTokens: integer("total_tokens").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// AI Messages (with token tracking, quality rating, and safety flags)
export const aiMessagesTable = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => aiConversationsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant" | "system"
  content: text("content").notNull(),
  model: text("model").notNull(),
  provider: text("provider").notNull(),
  tokensUsed: integer("tokens_used").notNull().default(0),
  costUsd: real("cost_usd").notNull().default(0),
  rating: integer("rating"), // 1-5 quality rating from user
  feedback: text("feedback"),
  isFlagged: boolean("is_flagged").notNull().default(false),
  flagReason: text("flag_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// AI Audit Logs (prompt safety, blocked requests, cost tracking)
export const aiAuditLogsTable = pgTable("ai_audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  conversationId: integer("conversation_id"),
  action: text("action").notNull(), // "send_message", "prompt_blocked", "model_switch", "quota_exceeded"
  model: text("model").notNull(),
  tokensUsed: integer("tokens_used").notNull().default(0),
  costUsd: real("cost_usd").notNull().default(0),
  metadata: text("metadata"), // JSON string
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Feature Flags (Phase 19 Admin)
export const featureFlagsTable = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type AiProvider = typeof aiGovernanceProvidersTable.$inferSelect;
export type AiConversation = typeof aiConversationsTable.$inferSelect;
export type AiMessage = typeof aiMessagesTable.$inferSelect;
export type AiAuditLog = typeof aiAuditLogsTable.$inferSelect;
export type FeatureFlag = typeof featureFlagsTable.$inferSelect;
