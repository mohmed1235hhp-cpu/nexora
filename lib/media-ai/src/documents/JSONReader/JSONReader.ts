// Documents / JSONReader — service (provider-agnostic; wire through the router)
import type { JSONReaderRequest, JSONReaderResponse } from "./JSONReaderTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface JSONReaderHandler {
  handle(req: JSONReaderRequest): Promise<JSONReaderResponse>;
}
export class JSONReaderService implements JSONReaderHandler {
  constructor(private readonly handler?: JSONReaderHandler) {}
  async handle(req: JSONReaderRequest): Promise<JSONReaderResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "JSONReader handler is not wired");
    return this.handler.handle(req);
  }
}
