import type { QueueItem, QueueStats } from '../types/queue.js';
export interface IQueue<T> {
  readonly name: string;
  enqueue(payload: T, opts?: { priority?: number; notBefore?: number }): QueueItem<T>;
  dequeue(): QueueItem<T> | undefined;
  peek(): QueueItem<T> | undefined;
  size(): number;
  stats(): QueueStats;
  markCompleted(id: string): void;
  markFailed(id: string): void;
}
