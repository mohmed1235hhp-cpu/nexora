// Image / ImageMetadata — service (provider-agnostic; wire through the router)
import type { ImageMetadataRequest, ImageMetadataResponse } from "./ImageMetadataTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface ImageMetadataHandler {
  handle(req: ImageMetadataRequest): Promise<ImageMetadataResponse>;
}
export class ImageMetadataService implements ImageMetadataHandler {
  constructor(private readonly handler?: ImageMetadataHandler) {}
  async handle(req: ImageMetadataRequest): Promise<ImageMetadataResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "ImageMetadata handler is not wired");
    return this.handler.handle(req);
  }
}
