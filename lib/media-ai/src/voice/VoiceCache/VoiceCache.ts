// Voice / VoiceCache — service (provider-agnostic; wire through the router)
import type { VoiceCacheRequest, VoiceCacheResponse } from "./VoiceCacheTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface VoiceCacheHandler {
  handle(req: VoiceCacheRequest): Promise<VoiceCacheResponse>;
}
export class VoiceCacheService implements VoiceCacheHandler {
  constructor(private readonly handler?: VoiceCacheHandler) {}
  async handle(req: VoiceCacheRequest): Promise<VoiceCacheResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "VoiceCache handler is not wired");
    return this.handler.handle(req);
  }
}
