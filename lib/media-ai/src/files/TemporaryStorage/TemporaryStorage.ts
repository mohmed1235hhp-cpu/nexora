// Files / TemporaryStorage — service (provider-agnostic; wire through the router)
import type { TemporaryStorageRequest, TemporaryStorageResponse } from "./TemporaryStorageTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface TemporaryStorageHandler {
  handle(req: TemporaryStorageRequest): Promise<TemporaryStorageResponse>;
}
export class TemporaryStorageService implements TemporaryStorageHandler {
  constructor(private readonly handler?: TemporaryStorageHandler) {}
  async handle(req: TemporaryStorageRequest): Promise<TemporaryStorageResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "TemporaryStorage handler is not wired");
    return this.handler.handle(req);
  }
}
