import type { ConversationTurn } from "../types/context.types";

export class HistoryTracker {
  private turns: ConversationTurn[] = [];
  add(turn: ConversationTurn): void {
    this.turns.push(turn);
  }
  all(): ConversationTurn[] {
    return [...this.turns];
  }
  clear(): void {
    this.turns = [];
  }
}
