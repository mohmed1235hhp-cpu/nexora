// OCR / OCRLanguageDetector — service (provider-agnostic; wire through the router)
import type { OCRLanguageDetectorRequest, OCRLanguageDetectorResponse } from "./OCRLanguageDetectorTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface OCRLanguageDetectorHandler {
  handle(req: OCRLanguageDetectorRequest): Promise<OCRLanguageDetectorResponse>;
}
export class OCRLanguageDetectorService implements OCRLanguageDetectorHandler {
  constructor(private readonly handler?: OCRLanguageDetectorHandler) {}
  async handle(req: OCRLanguageDetectorRequest): Promise<OCRLanguageDetectorResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "OCRLanguageDetector handler is not wired");
    return this.handler.handle(req);
  }
}
