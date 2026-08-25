import { describe, it, expect } from 'vitest';
import { InMemoryQueue } from '../src/queue/InMemoryQueue.js';

describe('InMemoryQueue', () => {
  it('respects priority ordering', () => {
    const q = new InMemoryQueue<string>('t');
    q.enqueue('low', { priority: 1 });
    q.enqueue('high', { priority: 10 });
    q.enqueue('mid', { priority: 5 });
    expect(q.dequeue()?.payload).toBe('high');
    expect(q.dequeue()?.payload).toBe('mid');
    expect(q.dequeue()?.payload).toBe('low');
  });

  it('tracks stats through the lifecycle', () => {
    const q = new InMemoryQueue<number>('t');
    const a = q.enqueue(1);
    const b = q.enqueue(2);
    q.dequeue();
    q.dequeue();
    q.markCompleted(a.id);
    q.markFailed(b.id);
    const s = q.stats();
    expect(s.processed).toBe(1);
    expect(s.failed).toBe(1);
  });
});
