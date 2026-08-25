import type { PromptMessage } from "./prompt.types";

export interface ConversationTurn {
  id: string;
  role: PromptMessage["role"];
  content: string;
  createdAt: string;
  tokens?: number;
}

export interface ContextSnapshot {
  turns: ConversationTurn[];
  summary?: string;
  tokenCount: number;
}
