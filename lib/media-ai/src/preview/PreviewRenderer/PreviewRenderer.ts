// preview / PreviewRenderer — service (provider-agnostic; wire through the router)
import type { PreviewRendererRequest, PreviewRendererResponse } from "./PreviewRendererTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface PreviewRendererHandler {
  handle(req: PreviewRendererRequest): Promise<PreviewRendererResponse>;
}
export class PreviewRendererService implements PreviewRendererHandler {
  constructor(private readonly handler?: PreviewRendererHandler) {}
  async handle(req: PreviewRendererRequest): Promise<PreviewRendererResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "PreviewRenderer handler is not wired");
    return this.handler.handle(req);
  }
}
