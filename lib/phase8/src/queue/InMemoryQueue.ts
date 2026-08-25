/**
 * Phase 8 — In-memory priority queue (test / dev fallback).
 * Same IQueue<T> contract as PostgresQueue, no external deps.
 */
import type { IQueue } from '@workspace/deploy-platform/interfaces';
import type { QueueItem, QueueStats } from '@workspace/deploy-platform/types';

export class InMemoryQueue<T> implements IQueue<T> {
  readonly name: string;
  private readonly items: Array<QueueItem<T> & { locked?: boolean }> = [];
  private _processed = 0;
  private _failed = 0;
  private _inflight = 0;

  constructor(name: string) { this.name = name; }

  enqueue(payload: T, opts?: { priority?: number; notBefore?: number }): QueueItem<T> {
    const item: QueueItem<T> = {
      id: `mem_${Date.now().toString(36)}_${this.items.length}`,
      payload,
      priority: opts?.priority ?? 0,
      enqueuedAt: Date.now(),
      notBefore: opts?.notBefore,
      attempts: 0,
    };
    this.items.push(item);
    this.items.sort((a, b) => b.priority - a.priority || a.enqueuedAt - b.enqueuedAt);
    return item;
  }

  dequeue(): QueueItem<T> | undefined {
    const now = Date.now();
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      if (it && !it.locked && (!it.notBefore || it.notBefore <= now)) {
        it.locked = true;
        this._inflight += 1;
        return { ...it, attempts: it.attempts + 1 };
      }
    }
    return undefined;
  }

  peek(): QueueItem<T> | undefined { return this.items.find(i => !i.locked); }
  size(): number { return this.items.length; }
  stats(): QueueStats {
    return { name: this.name, size: this.items.length, inflight: this._inflight, processed: this._processed, failed: this._failed };
  }
  markCompleted(id: string): void {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx >= 0) { this.items.splice(idx, 1); this._processed += 1; this._inflight = Math.max(0, this._inflight - 1); }
  }
  markFailed(id: string): void {
    const it = this.items.find(i => i.id === id);
    if (it) { it.locked = false; this._failed += 1; this._inflight = Math.max(0, this._inflight - 1); }
  }
}
