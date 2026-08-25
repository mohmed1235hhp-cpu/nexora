/** Core agent interface — every agent implements this. */
export interface IAgent {
  readonly id: string;
  readonly name: string;
  readonly capabilities: AgentCapability[];
  execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult>;
}

export interface AgentDescriptor {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  priority: number;
}

export type AgentCapability =
  | "request-parsing"
  | "planning"
  | "research"
  | "architecture"
  | "coding"
  | "review"
  | "debugging"
  | "testing"
  | "documentation"
  | "deployment"
  | "website-generation"
  | "application-generation"
  | "image-generation"
  | "voice-processing"
  | "file-handling"
  | "security-analysis"
  | "performance-analysis"
  | "monitoring";

export interface AgentContext {
  logger: AgentLoggerLike;
  bus: MessageBusLike;
  shared: SharedKnowledgeLike;
  artifacts: ArtifactStoreLike;
  router: AIRouterLike;
  timeline: TimelineEmitterLike;
  monitor: AgentMonitorLike;
  sessionId: string;
}

// Minimal contracts — avoid circular deps
export interface AgentLoggerLike { log(agent: string, level: string, msg: string, meta?: Record<string,unknown>): void; }
export interface MessageBusLike { publish(msg: AgentMessage): void; subscribe(topic: string, handler: (msg: AgentMessage) => void): () => void; }
export interface SharedKnowledgeLike { get<T>(key: string): T | undefined; set<T>(key: string, val: T): void; }
export interface ArtifactStoreLike { store(id: string, data: unknown): void; retrieve(id: string): unknown | undefined; }
export interface AIRouterLike { execute(req: unknown): Promise<unknown>; }
export interface TimelineEmitterLike { emit(event: TimelineEventData): void; }
export interface AgentMonitorLike { recordAgentStart(id: string): void; recordAgentEnd(id: string, ok: boolean, durationMs: number): void; }

import type { AgentMessage } from "./message.types";
import type { AgentTask } from "./task.types";
import type { AgentResult } from "./result.types";
import type { TimelineEventData } from "./timeline.types";
