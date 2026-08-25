// Image / ImageGenerator — service (provider-agnostic; wire through the router)
import type { ImageGeneratorRequest, ImageGeneratorResponse } from "./ImageGeneratorTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface ImageGeneratorHandler {
  handle(req: ImageGeneratorRequest): Promise<ImageGeneratorResponse>;
}
export class ImageGeneratorService implements ImageGeneratorHandler {
  constructor(private readonly handler?: ImageGeneratorHandler) {}
  async handle(req: ImageGeneratorRequest): Promise<ImageGeneratorResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "ImageGenerator handler is not wired");
    return this.handler.handle(req);
  }
}
