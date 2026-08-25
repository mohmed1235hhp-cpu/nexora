// OCR / OCRValidator — service (provider-agnostic; wire through the router)
import type { OCRValidatorRequest, OCRValidatorResponse } from "./OCRValidatorTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface OCRValidatorHandler {
  handle(req: OCRValidatorRequest): Promise<OCRValidatorResponse>;
}
export class OCRValidatorService implements OCRValidatorHandler {
  constructor(private readonly handler?: OCRValidatorHandler) {}
  async handle(req: OCRValidatorRequest): Promise<OCRValidatorResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "OCRValidator handler is not wired");
    return this.handler.handle(req);
  }
}
