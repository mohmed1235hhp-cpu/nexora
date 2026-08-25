// Documents / PDFAnalyzer — service (provider-agnostic; wire through the router)
import type { PDFAnalyzerRequest, PDFAnalyzerResponse } from "./PDFAnalyzerTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface PDFAnalyzerHandler {
  handle(req: PDFAnalyzerRequest): Promise<PDFAnalyzerResponse>;
}
export class PDFAnalyzerService implements PDFAnalyzerHandler {
  constructor(private readonly handler?: PDFAnalyzerHandler) {}
  async handle(req: PDFAnalyzerRequest): Promise<PDFAnalyzerResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "PDFAnalyzer handler is not wired");
    return this.handler.handle(req);
  }
}
