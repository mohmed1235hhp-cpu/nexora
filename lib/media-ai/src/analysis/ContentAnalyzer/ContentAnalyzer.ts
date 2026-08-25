// analysis / ContentAnalyzer — service (provider-agnostic; wire through the router)
import type { ContentAnalyzerRequest, ContentAnalyzerResponse } from "./ContentAnalyzerTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface ContentAnalyzerHandler {
  handle(req: ContentAnalyzerRequest): Promise<ContentAnalyzerResponse>;
}
export class ContentAnalyzerService implements ContentAnalyzerHandler {
  constructor(private readonly handler?: ContentAnalyzerHandler) {}
  async handle(req: ContentAnalyzerRequest): Promise<ContentAnalyzerResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "ContentAnalyzer handler is not wired");
    return this.handler.handle(req);
  }
}
