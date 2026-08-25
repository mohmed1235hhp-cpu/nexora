// Image / Upscaler — service (provider-agnostic; wire through the router)
import type { UpscalerRequest, UpscalerResponse } from "./UpscalerTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface UpscalerHandler {
  handle(req: UpscalerRequest): Promise<UpscalerResponse>;
}
export class UpscalerService implements UpscalerHandler {
  constructor(private readonly handler?: UpscalerHandler) {}
  async handle(req: UpscalerRequest): Promise<UpscalerResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "Upscaler handler is not wired");
    return this.handler.handle(req);
  }
}
