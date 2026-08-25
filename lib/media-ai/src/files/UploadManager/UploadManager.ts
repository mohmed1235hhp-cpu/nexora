// Files / UploadManager — service (provider-agnostic; wire through the router)
import type { UploadManagerRequest, UploadManagerResponse } from "./UploadManagerTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface UploadManagerHandler {
  handle(req: UploadManagerRequest): Promise<UploadManagerResponse>;
}
export class UploadManagerService implements UploadManagerHandler {
  constructor(private readonly handler?: UploadManagerHandler) {}
  async handle(req: UploadManagerRequest): Promise<UploadManagerResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "UploadManager handler is not wired");
    return this.handler.handle(req);
  }
}
