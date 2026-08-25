// Voice / VoiceChat — service (provider-agnostic; wire through the router)
import type { VoiceChatRequest, VoiceChatResponse } from "./VoiceChatTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface VoiceChatHandler {
  handle(req: VoiceChatRequest): Promise<VoiceChatResponse>;
}
export class VoiceChatService implements VoiceChatHandler {
  constructor(private readonly handler?: VoiceChatHandler) {}
  async handle(req: VoiceChatRequest): Promise<VoiceChatResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "VoiceChat handler is not wired");
    return this.handler.handle(req);
  }
}
