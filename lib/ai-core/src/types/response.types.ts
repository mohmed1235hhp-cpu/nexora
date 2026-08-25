import type { AIErrorCode } from "./error.types";

export interface AIUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  costUsd?: number;
}

export interface AIResponse<TData = unknown> {
  ok: boolean;
  data?: TData;
  errorCode?: AIErrorCode;
  errorMessage?: string;
  providerId?: string;
  modelId?: string;
  usage?: AIUsage;
  requestId?: string;
}
