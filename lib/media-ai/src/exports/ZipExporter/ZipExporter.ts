// exports / ZipExporter — service (provider-agnostic; wire through the router)
import type { ZipExporterRequest, ZipExporterResponse } from "./ZipExporterTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface ZipExporterHandler {
  handle(req: ZipExporterRequest): Promise<ZipExporterResponse>;
}
export class ZipExporterService implements ZipExporterHandler {
  constructor(private readonly handler?: ZipExporterHandler) {}
  async handle(req: ZipExporterRequest): Promise<ZipExporterResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "ZipExporter handler is not wired");
    return this.handler.handle(req);
  }
}
