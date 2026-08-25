// history / HistoryQuery — service (provider-agnostic; wire through the router)
import type { HistoryQueryRequest, HistoryQueryResponse } from "./HistoryQueryTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface HistoryQueryHandler {
  handle(req: HistoryQueryRequest): Promise<HistoryQueryResponse>;
}
export class HistoryQueryService implements HistoryQueryHandler {
  constructor(private readonly handler?: HistoryQueryHandler) {}
  async handle(req: HistoryQueryRequest): Promise<HistoryQueryResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "HistoryQuery handler is not wired");
    return this.handler.handle(req);
  }
}
