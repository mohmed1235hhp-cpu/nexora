// exports / CSVExporter — service (provider-agnostic; wire through the router)
import type { CSVExporterRequest, CSVExporterResponse } from "./CSVExporterTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface CSVExporterHandler {
  handle(req: CSVExporterRequest): Promise<CSVExporterResponse>;
}
export class CSVExporterService implements CSVExporterHandler {
  constructor(private readonly handler?: CSVExporterHandler) {}
  async handle(req: CSVExporterRequest): Promise<CSVExporterResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "CSVExporter handler is not wired");
    return this.handler.handle(req);
  }
}
