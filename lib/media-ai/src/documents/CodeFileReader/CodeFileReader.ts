// Documents / CodeFileReader — service (provider-agnostic; wire through the router)
import type { CodeFileReaderRequest, CodeFileReaderResponse } from "./CodeFileReaderTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface CodeFileReaderHandler {
  handle(req: CodeFileReaderRequest): Promise<CodeFileReaderResponse>;
}
export class CodeFileReaderService implements CodeFileReaderHandler {
  constructor(private readonly handler?: CodeFileReaderHandler) {}
  async handle(req: CodeFileReaderRequest): Promise<CodeFileReaderResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "CodeFileReader handler is not wired");
    return this.handler.handle(req);
  }
}
