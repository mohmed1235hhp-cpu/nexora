// Documents / WordAnalyzer — service (provider-agnostic; wire through the router)
import type { WordAnalyzerRequest, WordAnalyzerResponse } from "./WordAnalyzerTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface WordAnalyzerHandler {
  handle(req: WordAnalyzerRequest): Promise<WordAnalyzerResponse>;
}
export class WordAnalyzerService implements WordAnalyzerHandler {
  constructor(private readonly handler?: WordAnalyzerHandler) {}
  async handle(req: WordAnalyzerRequest): Promise<WordAnalyzerResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "WordAnalyzer handler is not wired");
    return this.handler.handle(req);
  }
}
