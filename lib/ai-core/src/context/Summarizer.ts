import type { ConversationTurn } from "../types/context.types";

export class Summarizer {
  summarize(turns: ConversationTurn[]): string {
    if (turns.length === 0) return "";
    return `Summary of ${turns.length} turn(s).`;
  }
}
