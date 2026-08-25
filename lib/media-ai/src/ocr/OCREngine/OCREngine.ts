// OCR / OCREngine — service (provider-agnostic; wire through the router)
import type { OCREngineRequest, OCREngineResponse } from "./OCREngineTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface OCREngineHandler {
  handle(req: OCREngineRequest): Promise<OCREngineResponse>;
}
export class OCREngineService implements OCREngineHandler {
  constructor(private readonly handler?: OCREngineHandler) {}
  async handle(req: OCREngineRequest): Promise<OCREngineResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "OCREngine handler is not wired");
    return this.handler.handle(req);
  }
}
