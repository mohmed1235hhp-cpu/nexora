import { BaseQueue } from './base-queue.js';
export class DelayedQueue<T> extends BaseQueue<T> {
  constructor(name = 'delayedqueue') { super({ name }); }
  enqueue(payload: T, opts?: { priority?: number; notBefore?: number }) {
    return super.enqueue(payload, { priority: (opts?.priority ?? 0) + 0, notBefore: opts?.notBefore });
  }
}
