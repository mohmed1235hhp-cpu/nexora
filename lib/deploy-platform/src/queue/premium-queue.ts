import { BaseQueue } from './base-queue.js';
export class PremiumQueue<T> extends BaseQueue<T> {
  constructor(name = 'premiumqueue') { super({ name }); }
  enqueue(payload: T, opts?: { priority?: number; notBefore?: number }) {
    return super.enqueue(payload, { priority: (opts?.priority ?? 0) + 100, notBefore: opts?.notBefore });
  }
}
