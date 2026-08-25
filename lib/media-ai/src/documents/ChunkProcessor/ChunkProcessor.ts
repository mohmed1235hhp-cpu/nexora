// Documents / ChunkProcessor — service (provider-agnostic; wire through the router)
import type { ChunkProcessorRequest, ChunkProcessorResponse } from "./ChunkProcessorTypes.js";
import { MediaError } from "../../errors/MediaError.js";
export interface ChunkProcessorHandler {
  handle(req: ChunkProcessorRequest): Promise<ChunkProcessorResponse>;
}
export class ChunkProcessorService implements ChunkProcessorHandler {
  constructor(private readonly handler?: ChunkProcessorHandler) {}
  async handle(req: ChunkProcessorRequest): Promise<ChunkProcessorResponse> {
    if (!this.handler) throw new MediaError("MEDIA_NOT_WIRED", "ChunkProcessor handler is not wired");
    return this.handler.handle(req);
  }
}
