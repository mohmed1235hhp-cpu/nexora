// Image / BackgroundRemover — service (provider-agnostic; wire through the router)
import type { BackgroundRemoverRequest, BackgroundRemoverResponse } from "./BackgroundRemoverTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface BackgroundRemoverHandler {
  handle(req: BackgroundRemoverRequest): Promise<BackgroundRemoverResponse>;
}
export class BackgroundRemoverService implements BackgroundRemoverHandler {
  constructor(private readonly handler?: BackgroundRemoverHandler) {}
  async handle(req: BackgroundRemoverRequest): Promise<BackgroundRemoverResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "BackgroundRemover handler is not wired");
    return this.handler.handle(req);
  }
}
