import { BaseQueue } from './base-queue.js';
export class PriorityQueue<T> extends BaseQueue<T> {
  constructor(name = 'priorityqueue') { super({ name }); }
  enqueue(payload: T, opts?: { priority?: number; notBefore?: number }) {
    return super.enqueue(payload, { priority: (opts?.priority ?? 0) + 10, notBefore: opts?.notBefore });
  }
}
