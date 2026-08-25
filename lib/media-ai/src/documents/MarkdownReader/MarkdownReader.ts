// Documents / MarkdownReader — service (provider-agnostic; wire through the router)
import type { MarkdownReaderRequest, MarkdownReaderResponse } from "./MarkdownReaderTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface MarkdownReaderHandler {
  handle(req: MarkdownReaderRequest): Promise<MarkdownReaderResponse>;
}
export class MarkdownReaderService implements MarkdownReaderHandler {
  constructor(private readonly handler?: MarkdownReaderHandler) {}
  async handle(req: MarkdownReaderRequest): Promise<MarkdownReaderResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "MarkdownReader handler is not wired");
    return this.handler.handle(req);
  }
}
