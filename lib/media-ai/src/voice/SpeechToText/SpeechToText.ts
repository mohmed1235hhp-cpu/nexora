// Voice / SpeechToText — service (provider-agnostic; wire through the router)
import type { SpeechToTextRequest, SpeechToTextResponse } from "./SpeechToTextTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface SpeechToTextHandler {
  handle(req: SpeechToTextRequest): Promise<SpeechToTextResponse>;
}
export class SpeechToTextService implements SpeechToTextHandler {
  constructor(private readonly handler?: SpeechToTextHandler) {}
  async handle(req: SpeechToTextRequest): Promise<SpeechToTextResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "SpeechToText handler is not wired");
    return this.handler.handle(req);
  }
}
