// Image / ImageHistory — service (provider-agnostic; wire through the router)
import type { ImageHistoryRequest, ImageHistoryResponse } from "./ImageHistoryTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface ImageHistoryHandler {
  handle(req: ImageHistoryRequest): Promise<ImageHistoryResponse>;
}
export class ImageHistoryService implements ImageHistoryHandler {
  constructor(private readonly handler?: ImageHistoryHandler) {}
  async handle(req: ImageHistoryRequest): Promise<ImageHistoryResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "ImageHistory handler is not wired");
    return this.handler.handle(req);
  }
}
