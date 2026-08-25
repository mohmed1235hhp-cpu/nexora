// Documents / TextFileReader — service (provider-agnostic; wire through the router)
import type { TextFileReaderRequest, TextFileReaderResponse } from "./TextFileReaderTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface TextFileReaderHandler {
  handle(req: TextFileReaderRequest): Promise<TextFileReaderResponse>;
}
export class TextFileReaderService implements TextFileReaderHandler {
  constructor(private readonly handler?: TextFileReaderHandler) {}
  async handle(req: TextFileReaderRequest): Promise<TextFileReaderResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "TextFileReader handler is not wired");
    return this.handler.handle(req);
  }
}
