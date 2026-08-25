// analysis / SentimentAnalyzer — service (provider-agnostic; wire through the router)
import type { SentimentAnalyzerRequest, SentimentAnalyzerResponse } from "./SentimentAnalyzerTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface SentimentAnalyzerHandler {
  handle(req: SentimentAnalyzerRequest): Promise<SentimentAnalyzerResponse>;
}
export class SentimentAnalyzerService implements SentimentAnalyzerHandler {
  constructor(private readonly handler?: SentimentAnalyzerHandler) {}
  async handle(req: SentimentAnalyzerRequest): Promise<SentimentAnalyzerResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "SentimentAnalyzer handler is not wired");
    return this.handler.handle(req);
  }
}
