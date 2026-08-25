// Voice / VoiceStreaming — service (provider-agnostic; wire through the router)
import type { VoiceStreamingRequest, VoiceStreamingResponse } from "./VoiceStreamingTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface VoiceStreamingHandler {
  handle(req: VoiceStreamingRequest): Promise<VoiceStreamingResponse>;
}
export class VoiceStreamingService implements VoiceStreamingHandler {
  constructor(private readonly handler?: VoiceStreamingHandler) {}
  async handle(req: VoiceStreamingRequest): Promise<VoiceStreamingResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "VoiceStreaming handler is not wired");
    return this.handler.handle(req);
  }
}
