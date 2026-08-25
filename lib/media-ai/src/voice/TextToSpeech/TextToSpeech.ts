// Voice / TextToSpeech — service (provider-agnostic; wire through the router)
import type { TextToSpeechRequest, TextToSpeechResponse } from "./TextToSpeechTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface TextToSpeechHandler {
  handle(req: TextToSpeechRequest): Promise<TextToSpeechResponse>;
}
export class TextToSpeechService implements TextToSpeechHandler {
  constructor(private readonly handler?: TextToSpeechHandler) {}
  async handle(req: TextToSpeechRequest): Promise<TextToSpeechResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "TextToSpeech handler is not wired");
    return this.handler.handle(req);
  }
}
