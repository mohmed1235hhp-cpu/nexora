// Voice / VoiceTimeline — service (provider-agnostic; wire through the router)
import type { VoiceTimelineRequest, VoiceTimelineResponse } from "./VoiceTimelineTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface VoiceTimelineHandler {
  handle(req: VoiceTimelineRequest): Promise<VoiceTimelineResponse>;
}
export class VoiceTimelineService implements VoiceTimelineHandler {
  constructor(private readonly handler?: VoiceTimelineHandler) {}
  async handle(req: VoiceTimelineRequest): Promise<VoiceTimelineResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "VoiceTimeline handler is not wired");
    return this.handler.handle(req);
  }
}
