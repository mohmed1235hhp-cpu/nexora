// OCR / OCRFormatter — service (provider-agnostic; wire through the router)
import type { OCRFormatterRequest, OCRFormatterResponse } from "./OCRFormatterTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface OCRFormatterHandler {
  handle(req: OCRFormatterRequest): Promise<OCRFormatterResponse>;
}
export class OCRFormatterService implements OCRFormatterHandler {
  constructor(private readonly handler?: OCRFormatterHandler) {}
  async handle(req: OCRFormatterRequest): Promise<OCRFormatterResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "OCRFormatter handler is not wired");
    return this.handler.handle(req);
  }
}
