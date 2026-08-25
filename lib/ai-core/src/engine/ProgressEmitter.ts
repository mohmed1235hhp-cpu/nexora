import type { StreamEvent, StreamHandler } from "../types/streaming.types";

export class ProgressEmitter<T = unknown> {
  constructor(private handler: StreamHandler<T>) {}
  emit(ev: StreamEvent<T>): void {
    this.handler(ev);
  }
  progress(p: number): void {
    this.handler({ type: "progress", progress: p });
  }
}
