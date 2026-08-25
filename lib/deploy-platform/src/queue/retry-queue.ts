import { BaseQueue } from './base-queue.js';
export class RetryQueue<T> extends BaseQueue<T> {
  constructor(name = 'retryqueue') { super({ name }); }
  enqueue(payload: T, opts?: { priority?: number; notBefore?: number }) {
    return super.enqueue(payload, { priority: (opts?.priority ?? 0) + 5, notBefore: opts?.notBefore });
  }
}
