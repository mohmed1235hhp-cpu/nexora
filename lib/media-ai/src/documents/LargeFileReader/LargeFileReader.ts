// Documents / LargeFileReader — service (provider-agnostic; wire through the router)
import type { LargeFileReaderRequest, LargeFileReaderResponse } from "./LargeFileReaderTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface LargeFileReaderHandler {
  handle(req: LargeFileReaderRequest): Promise<LargeFileReaderResponse>;
}
export class LargeFileReaderService implements LargeFileReaderHandler {
  constructor(private readonly handler?: LargeFileReaderHandler) {}
  async handle(req: LargeFileReaderRequest): Promise<LargeFileReaderResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "LargeFileReader handler is not wired");
    return this.handler.handle(req);
  }
}
