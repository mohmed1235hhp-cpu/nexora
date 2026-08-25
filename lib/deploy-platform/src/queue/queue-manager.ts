import { GlobalQueue } from './global-queue.js';
import { PriorityQueue } from './priority-queue.js';
import { PremiumQueue } from './premium-queue.js';
import { RetryQueue } from './retry-queue.js';
import { DelayedQueue } from './delayed-queue.js';
import type { QueueStats } from '../types/queue.js';

export class QueueManager<T> {
  readonly globalQ = new GlobalQueue<T>();
  readonly priorityQ = new PriorityQueue<T>();
  readonly premiumQ = new PremiumQueue<T>();
  readonly retryQ = new RetryQueue<T>();
  readonly delayedQ = new DelayedQueue<T>();
  all() { return [this.premiumQ, this.priorityQ, this.retryQ, this.globalQ, this.delayedQ]; }
  totalSize(): number { return this.all().reduce((n, q) => n + q.size(), 0); }
  stats(): readonly QueueStats[] { return this.all().map(q => q.stats()); }
  pullNext() {
    for (const q of this.all()) {
      const item = q.dequeue();
      if (item) return { queue: q, item };
    }
    return undefined;
  }
}
