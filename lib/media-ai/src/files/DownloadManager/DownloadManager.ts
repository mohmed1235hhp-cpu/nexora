// Files / DownloadManager — service (provider-agnostic; wire through the router)
import type { DownloadManagerRequest, DownloadManagerResponse } from "./DownloadManagerTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface DownloadManagerHandler {
  handle(req: DownloadManagerRequest): Promise<DownloadManagerResponse>;
}
export class DownloadManagerService implements DownloadManagerHandler {
  constructor(private readonly handler?: DownloadManagerHandler) {}
  async handle(req: DownloadManagerRequest): Promise<DownloadManagerResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "DownloadManager handler is not wired");
    return this.handler.handle(req);
  }
}
