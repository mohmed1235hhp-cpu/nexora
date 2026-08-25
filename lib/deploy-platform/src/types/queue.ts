export interface QueueItem<T> {
  readonly id: string;
  readonly payload: T;
  readonly priority: number;
  readonly enqueuedAt: number;
  readonly notBefore?: number;
  readonly attempts: number;
}
export interface QueueStats {
  readonly name: string;
  readonly size: number;
  readonly inflight: number;
  readonly processed: number;
  readonly failed: number;
}
