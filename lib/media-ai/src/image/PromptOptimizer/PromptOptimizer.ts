// Image / PromptOptimizer — service (provider-agnostic; wire through the router)
import type { PromptOptimizerRequest, PromptOptimizerResponse } from "./PromptOptimizerTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface PromptOptimizerHandler {
  handle(req: PromptOptimizerRequest): Promise<PromptOptimizerResponse>;
}
export class PromptOptimizerService implements PromptOptimizerHandler {
  constructor(private readonly handler?: PromptOptimizerHandler) {}
  async handle(req: PromptOptimizerRequest): Promise<PromptOptimizerResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "PromptOptimizer handler is not wired");
    return this.handler.handle(req);
  }
}
