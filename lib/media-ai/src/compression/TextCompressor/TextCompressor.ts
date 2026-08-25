// compression / TextCompressor — service (provider-agnostic; wire through the router)
import type { TextCompressorRequest, TextCompressorResponse } from "./TextCompressorTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface TextCompressorHandler {
  handle(req: TextCompressorRequest): Promise<TextCompressorResponse>;
}
export class TextCompressorService implements TextCompressorHandler {
  constructor(private readonly handler?: TextCompressorHandler) {}
  async handle(req: TextCompressorRequest): Promise<TextCompressorResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "TextCompressor handler is not wired");
    return this.handler.handle(req);
  }
}
