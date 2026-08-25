import { describe, it, expect } from 'vitest';
import { QueueManager } from '../src/queue/queue-manager.js';

describe('QueueManager', () => {
  it('drains premium before global', () => {
    const qm = new QueueManager<string>();
    qm.globalQ.enqueue('normal');
    qm.premiumQ.enqueue('paid');
    const first = qm.pullNext();
    expect(first?.item.payload).toBe('paid');
  });

  it('reports stats for every queue', () => {
    const qm = new QueueManager<number>();
    qm.globalQ.enqueue(1);
    expect(qm.stats().length).toBe(5);
    expect(qm.totalSize()).toBe(1);
  });
});
