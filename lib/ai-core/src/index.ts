/**
 * AI Core — public API.
 * UI code MUST import ONLY from this module.
 */
export { AIRouter, getAIRouter } from "./router/AIRouter";
export { TaskType } from "./types/task.types";
export { AIError, AIErrorCode } from "./types/error.types";
export type { AIRequest, AIRequestMeta } from "./types/request.types";
export type { AIResponse, AIUsage } from "./types/response.types";
export type { PromptMessage, PromptRole, PromptTemplateDescriptor } from "./types/prompt.types";
export type { ProviderDescriptor, ProviderHealth } from "./types/provider.types";
export type { ModelDescriptor } from "./types/model.types";
export type { Capability, CapabilityDescriptor } from "./types/capability.types";
export type { StreamEvent, StreamEventType, StreamHandler } from "./types/streaming.types";
export type { MemoryEntry } from "./types/memory.types";
export type { ConversationTurn, ContextSnapshot } from "./types/context.types";
export type { DashboardSnapshot, ProviderDashboardStats } from "./monitoring/DashboardMetrics";
