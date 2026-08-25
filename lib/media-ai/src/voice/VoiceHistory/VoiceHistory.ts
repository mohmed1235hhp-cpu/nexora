// Voice / VoiceHistory — service (provider-agnostic; wire through the router)
import type { VoiceHistoryRequest, VoiceHistoryResponse } from "./VoiceHistoryTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface VoiceHistoryHandler {
  handle(req: VoiceHistoryRequest): Promise<VoiceHistoryResponse>;
}
export class VoiceHistoryService implements VoiceHistoryHandler {
  constructor(private readonly handler?: VoiceHistoryHandler) {}
  async handle(req: VoiceHistoryRequest): Promise<VoiceHistoryResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "VoiceHistory handler is not wired");
    return this.handler.handle(req);
  }
}
