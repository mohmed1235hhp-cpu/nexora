// Files / FileScanner — service (provider-agnostic; wire through the router)
import type { FileScannerRequest, FileScannerResponse } from "./FileScannerTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface FileScannerHandler {
  handle(req: FileScannerRequest): Promise<FileScannerResponse>;
}
export class FileScannerService implements FileScannerHandler {
  constructor(private readonly handler?: FileScannerHandler) {}
  async handle(req: FileScannerRequest): Promise<FileScannerResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "FileScanner handler is not wired");
    return this.handler.handle(req);
  }
}
