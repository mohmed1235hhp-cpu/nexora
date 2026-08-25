import type { ConversationTurn } from "../types/context.types";

export class ContextCompressor {
  compress(turns: ConversationTurn[], keepLast = 20): ConversationTurn[] {
    return turns.slice(-keepLast);
  }
}
