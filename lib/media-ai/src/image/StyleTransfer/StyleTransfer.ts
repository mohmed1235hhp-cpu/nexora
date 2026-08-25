// Image / StyleTransfer — service (provider-agnostic; wire through the router)
import type { StyleTransferRequest, StyleTransferResponse } from "./StyleTransferTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface StyleTransferHandler {
  handle(req: StyleTransferRequest): Promise<StyleTransferResponse>;
}
export class StyleTransferService implements StyleTransferHandler {
  constructor(private readonly handler?: StyleTransferHandler) {}
  async handle(req: StyleTransferRequest): Promise<StyleTransferResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "StyleTransfer handler is not wired");
    return this.handler.handle(req);
  }
}
