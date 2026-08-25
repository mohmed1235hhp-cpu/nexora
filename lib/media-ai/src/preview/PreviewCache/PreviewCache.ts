// preview / PreviewCache — service (provider-agnostic; wire through the router)
import type { PreviewCacheRequest, PreviewCacheResponse } from "./PreviewCacheTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface PreviewCacheHandler {
  handle(req: PreviewCacheRequest): Promise<PreviewCacheResponse>;
}
export class PreviewCacheService implements PreviewCacheHandler {
  constructor(private readonly handler?: PreviewCacheHandler) {}
  async handle(req: PreviewCacheRequest): Promise<PreviewCacheResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "PreviewCache handler is not wired");
    return this.handler.handle(req);
  }
}
