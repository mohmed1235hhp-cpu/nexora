export interface QueuedOp { id: string; kind: string; payload: unknown; ts: number; }
export class OfflineQueue {
  private q: QueuedOp[] = [];
  enqueue(op: Omit<QueuedOp, "ts">){ this.q.push({ ...op, ts: Date.now() }); }
  dequeue(): QueuedOp | undefined { return this.q.shift(); }
  size(){ return this.q.length; }
  peek(){ return [...this.q]; }
}
