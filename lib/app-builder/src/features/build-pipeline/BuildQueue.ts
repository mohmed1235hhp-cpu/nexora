export interface QueuedBuild { id: string; description: string; enqueuedAt: number; }
export class BuildQueue {
  private q: QueuedBuild[] = [];
  enqueue(b: QueuedBuild){ this.q.push(b); }
  dequeue(){ return this.q.shift(); }
  size(){ return this.q.length; }
  list(){ return [...this.q]; }
}
export const buildQueue = new BuildQueue();
