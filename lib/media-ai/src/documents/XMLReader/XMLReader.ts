// Documents / XMLReader — service (provider-agnostic; wire through the router)
import type { XMLReaderRequest, XMLReaderResponse } from "./XMLReaderTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface XMLReaderHandler {
  handle(req: XMLReaderRequest): Promise<XMLReaderResponse>;
}
export class XMLReaderService implements XMLReaderHandler {
  constructor(private readonly handler?: XMLReaderHandler) {}
  async handle(req: XMLReaderRequest): Promise<XMLReaderResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "XMLReader handler is not wired");
    return this.handler.handle(req);
  }
}
