// Image / ImageOptimizer — service (provider-agnostic; wire through the router)
import type { ImageOptimizerRequest, ImageOptimizerResponse } from "./ImageOptimizerTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface ImageOptimizerHandler {
  handle(req: ImageOptimizerRequest): Promise<ImageOptimizerResponse>;
}
export class ImageOptimizerService implements ImageOptimizerHandler {
  constructor(private readonly handler?: ImageOptimizerHandler) {}
  async handle(req: ImageOptimizerRequest): Promise<ImageOptimizerResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "ImageOptimizer handler is not wired");
    return this.handler.handle(req);
  }
}
