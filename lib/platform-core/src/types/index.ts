/**
 * Public types for @workspace/platform-core (Phase 1).
 */

export type Intent =
  | "chat"
  | "search"
  | "image.generate"
  | "image.analyze"
  | "voice"
  | "code.generate"
  | "code.review"
  | "code.fix"
  | "app.build"
  | "website.build"
  | "document.analyze"
  | "research"
  | "general";

export type Complexity = "trivial" | "simple" | "moderate" | "complex";

export interface UserRequest {
  readonly requestId: string;
  readonly sessionId: string;
  readonly userId?: string;
  readonly input: string;
  readonly attachments?: readonly RequestAttachment[];
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly signal?: AbortSignal;
}

export interface RequestAttachment {
  readonly kind: "image" | "audio" | "document" | "url";
  readonly uri: string;
  readonly mime?: string;
  readonly bytes?: number;
}

export interface IntentAnalysis {
  readonly intent: Intent;
  readonly complexity: Complexity;
  readonly confidence: number;
  readonly requiredCapabilities: readonly string[];
  readonly reasoning: string;
}

export interface Task {
  readonly id: string;
  readonly name: string;
  readonly capability: string;
  readonly dependsOn: readonly string[];
  readonly input: unknown;
  readonly priority: number;
  readonly timeoutMs?: number;
  readonly retriable?: boolean;
}

export interface ExecutionPlan {
  readonly planId: string;
  readonly intent: IntentAnalysis;
  readonly tasks: readonly Task[];
  readonly parallelGroups: readonly (readonly string[])[];
  readonly createdAt: number;
}

export interface TaskResult {
  readonly taskId: string;
  readonly agentId: string;
  readonly ok: boolean;
  readonly output?: unknown;
  readonly error?: { code: string; message: string };
  readonly startedAt: number;
  readonly finishedAt: number;
  readonly retries: number;
}

export interface PlatformResponse {
  readonly requestId: string;
  readonly ok: boolean;
  readonly text: string;
  readonly artifacts: readonly PlatformArtifact[];
  readonly usage: {
    readonly totalTokens: number;
    readonly totalDurationMs: number;
    readonly tasksExecuted: number;
    readonly agentsInvolved: readonly string[];
  };
  readonly citations?: readonly Citation[];
  readonly warnings?: readonly string[];
}

export interface PlatformArtifact {
  readonly id: string;
  readonly kind: "text" | "image" | "audio" | "code" | "file" | "url" | "json";
  readonly mime?: string;
  readonly content?: string;
  readonly url?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface Citation {
  readonly title: string;
  readonly url: string;
  readonly snippet?: string;
  readonly source: string;
  readonly trusted: boolean;
}
