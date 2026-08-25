// Files / PreviewGenerator — service (provider-agnostic; wire through the router)
import type { PreviewGeneratorRequest, PreviewGeneratorResponse } from "./PreviewGeneratorTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface PreviewGeneratorHandler {
  handle(req: PreviewGeneratorRequest): Promise<PreviewGeneratorResponse>;
}
export class PreviewGeneratorService implements PreviewGeneratorHandler {
  constructor(private readonly handler?: PreviewGeneratorHandler) {}
  async handle(req: PreviewGeneratorRequest): Promise<PreviewGeneratorResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "PreviewGenerator handler is not wired");
    return this.handler.handle(req);
  }
}
