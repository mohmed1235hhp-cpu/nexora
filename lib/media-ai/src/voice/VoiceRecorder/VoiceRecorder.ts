// Voice / VoiceRecorder — service (provider-agnostic; wire through the router)
import type { VoiceRecorderRequest, VoiceRecorderResponse } from "./VoiceRecorderTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface VoiceRecorderHandler {
  handle(req: VoiceRecorderRequest): Promise<VoiceRecorderResponse>;
}
export class VoiceRecorderService implements VoiceRecorderHandler {
  constructor(private readonly handler?: VoiceRecorderHandler) {}
  async handle(req: VoiceRecorderRequest): Promise<VoiceRecorderResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "VoiceRecorder handler is not wired");
    return this.handler.handle(req);
  }
}
