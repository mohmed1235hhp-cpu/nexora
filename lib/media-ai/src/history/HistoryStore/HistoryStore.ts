// history / HistoryStore — service (provider-agnostic; wire through the router)
import type { HistoryStoreRequest, HistoryStoreResponse } from "./HistoryStoreTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface HistoryStoreHandler {
  handle(req: HistoryStoreRequest): Promise<HistoryStoreResponse>;
}
export class HistoryStoreService implements HistoryStoreHandler {
  constructor(private readonly handler?: HistoryStoreHandler) {}
  async handle(req: HistoryStoreRequest): Promise<HistoryStoreResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "HistoryStore handler is not wired");
    return this.handler.handle(req);
  }
}
