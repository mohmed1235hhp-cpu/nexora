import type { TaskType } from "./task.types";
import type { PromptMessage } from "./prompt.types";

export interface AIRequestMeta {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  stream?: boolean;
}

export interface AIRequest<TInput = unknown> {
  task: TaskType;
  input: TInput;
  messages?: PromptMessage[];
  modelId?: string;
  providerId?: string;
  meta?: AIRequestMeta;
}
