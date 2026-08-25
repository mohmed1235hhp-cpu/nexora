// compression / ImageCompressor — service (provider-agnostic; wire through the router)
import type { ImageCompressorRequest, ImageCompressorResponse } from "./ImageCompressorTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface ImageCompressorHandler {
  handle(req: ImageCompressorRequest): Promise<ImageCompressorResponse>;
}
export class ImageCompressorService implements ImageCompressorHandler {
  constructor(private readonly handler?: ImageCompressorHandler) {}
  async handle(req: ImageCompressorRequest): Promise<ImageCompressorResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "ImageCompressor handler is not wired");
    return this.handler.handle(req);
  }
}
