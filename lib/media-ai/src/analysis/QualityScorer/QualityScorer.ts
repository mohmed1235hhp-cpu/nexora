// analysis / QualityScorer — service (provider-agnostic; wire through the router)
import type { QualityScorerRequest, QualityScorerResponse } from "./QualityScorerTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface QualityScorerHandler {
  handle(req: QualityScorerRequest): Promise<QualityScorerResponse>;
}
export class QualityScorerService implements QualityScorerHandler {
  constructor(private readonly handler?: QualityScorerHandler) {}
  async handle(req: QualityScorerRequest): Promise<QualityScorerResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "QualityScorer handler is not wired");
    return this.handler.handle(req);
  }
}
