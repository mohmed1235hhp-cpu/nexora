// Image / ImageAnalyzer — service (provider-agnostic; wire through the router)
import type { ImageAnalyzerRequest, ImageAnalyzerResponse } from "./ImageAnalyzerTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface ImageAnalyzerHandler {
  handle(req: ImageAnalyzerRequest): Promise<ImageAnalyzerResponse>;
}
export class ImageAnalyzerService implements ImageAnalyzerHandler {
  constructor(private readonly handler?: ImageAnalyzerHandler) {}
  async handle(req: ImageAnalyzerRequest): Promise<ImageAnalyzerResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "ImageAnalyzer handler is not wired");
    return this.handler.handle(req);
  }
}
