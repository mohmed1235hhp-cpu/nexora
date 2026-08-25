import type { ConversationTurn } from "../types/context.types";

export class ContextWindow {
  constructor(public maxTokens = 8000) {}
  fit(turns: ConversationTurn[]): ConversationTurn[] {
    let total = 0;
    const out: ConversationTurn[] = [];
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i];
      const tokens = t.tokens ?? Math.ceil(t.content.length / 4);
      if (total + tokens > this.maxTokens) break;
      total += tokens;
      out.unshift(t);
    }
    return out;
  }
}
