import { HistoryTracker } from "./HistoryTracker";
import { Summarizer } from "./Summarizer";
import { ContextCompressor } from "./ContextCompressor";
import { ContextWindow } from "./ContextWindow";
import type { ContextSnapshot } from "../types/context.types";

export class ContextManager {
  readonly history = new HistoryTracker();
  readonly summarizer = new Summarizer();
  readonly compressor = new ContextCompressor();
  readonly window = new ContextWindow();

  snapshot(): ContextSnapshot {
    const compressed = this.compressor.compress(this.history.all());
    const windowed = this.window.fit(compressed);
    return {
      turns: windowed,
      summary: this.summarizer.summarize(this.history.all()),
      tokenCount: windowed.reduce((s, t) => s + (t.tokens ?? Math.ceil(t.content.length / 4)), 0),
    };
  }
}
