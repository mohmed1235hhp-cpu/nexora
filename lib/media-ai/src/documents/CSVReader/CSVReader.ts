// Documents / CSVReader — service (provider-agnostic; wire through the router)
import type { CSVReaderRequest, CSVReaderResponse } from "./CSVReaderTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface CSVReaderHandler {
  handle(req: CSVReaderRequest): Promise<CSVReaderResponse>;
}
export class CSVReaderService implements CSVReaderHandler {
  constructor(private readonly handler?: CSVReaderHandler) {}
  async handle(req: CSVReaderRequest): Promise<CSVReaderResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "CSVReader handler is not wired");
    return this.handler.handle(req);
  }
}
