// Image / ImageEditor — service (provider-agnostic; wire through the router)
import type { ImageEditorRequest, ImageEditorResponse } from "./ImageEditorTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface ImageEditorHandler {
  handle(req: ImageEditorRequest): Promise<ImageEditorResponse>;
}
export class ImageEditorService implements ImageEditorHandler {
  constructor(private readonly handler?: ImageEditorHandler) {}
  async handle(req: ImageEditorRequest): Promise<ImageEditorResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "ImageEditor handler is not wired");
    return this.handler.handle(req);
  }
}
