// exports / JSONExporter — service (provider-agnostic; wire through the router)
import type { JSONExporterRequest, JSONExporterResponse } from "./JSONExporterTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface JSONExporterHandler {
  handle(req: JSONExporterRequest): Promise<JSONExporterResponse>;
}
export class JSONExporterService implements JSONExporterHandler {
  constructor(private readonly handler?: JSONExporterHandler) {}
  async handle(req: JSONExporterRequest): Promise<JSONExporterResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "JSONExporter handler is not wired");
    return this.handler.handle(req);
  }
}
