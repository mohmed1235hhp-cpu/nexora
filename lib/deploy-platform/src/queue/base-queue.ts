import type { IQueue } from '../interfaces/IQueue.js';
import type { QueueItem, QueueStats } from '../types/queue.js';
import { newId } from '../utils/id.js';

export interface BaseQueueOptions { readonly name: string; }

export class BaseQueue<T> implements IQueue<T> {
  readonly name: string;
  protected items: QueueItem<T>[] = [];
  protected inflight = new Set<string>();
  protected processedCount = 0;
  protected failedCount = 0;
  constructor(opts: BaseQueueOptions) { this.name = opts.name; }

  enqueue(payload: T, opts?: { priority?: number; notBefore?: number }): QueueItem<T> {
    const item: QueueItem<T> = {
      id: newId('q'), payload,
      priority: opts?.priority ?? 0,
      enqueuedAt: Date.now(),
      notBefore: opts?.notBefore,
      attempts: 0,
    };
    this.items.push(item);
    this.sort();
    return item;
  }
  protected sort(): void {
    this.items.sort((a, b) => b.priority - a.priority || a.enqueuedAt - b.enqueuedAt);
  }
  dequeue(): QueueItem<T> | undefined {
    const now = Date.now();
    const idx = this.items.findIndex(i => !i.notBefore || i.notBefore <= now);
    if (idx < 0) return undefined;
    const [item] = this.items.splice(idx, 1);
    this.inflight.add(item.id);
    return item;
  }
  peek(): QueueItem<T> | undefined { return this.items[0]; }
  size(): number { return this.items.length; }
  stats(): QueueStats {
    return { name: this.name, size: this.items.length, inflight: this.inflight.size, processed: this.processedCount, failed: this.failedCount };
  }
  markCompleted(id: string): void { if (this.inflight.delete(id)) this.processedCount += 1; }
  markFailed(id: string): void { if (this.inflight.delete(id)) this.failedCount += 1; }
}
