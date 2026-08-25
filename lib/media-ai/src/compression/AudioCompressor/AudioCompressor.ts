// compression / AudioCompressor — service (provider-agnostic; wire through the router)
import type { AudioCompressorRequest, AudioCompressorResponse } from "./AudioCompressorTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface AudioCompressorHandler {
  handle(req: AudioCompressorRequest): Promise<AudioCompressorResponse>;
}
export class AudioCompressorService implements AudioCompressorHandler {
  constructor(private readonly handler?: AudioCompressorHandler) {}
  async handle(req: AudioCompressorRequest): Promise<AudioCompressorResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "AudioCompressor handler is not wired");
    return this.handler.handle(req);
  }
}
