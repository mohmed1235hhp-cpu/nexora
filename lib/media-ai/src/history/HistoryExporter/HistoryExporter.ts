// history / HistoryExporter — service (provider-agnostic; wire through the router)
import type { HistoryExporterRequest, HistoryExporterResponse } from "./HistoryExporterTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface HistoryExporterHandler {
  handle(req: HistoryExporterRequest): Promise<HistoryExporterResponse>;
}
export class HistoryExporterService implements HistoryExporterHandler {
  constructor(private readonly handler?: HistoryExporterHandler) {}
  async handle(req: HistoryExporterRequest): Promise<HistoryExporterResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "HistoryExporter handler is not wired");
    return this.handler.handle(req);
  }
}
