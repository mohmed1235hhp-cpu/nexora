import type { ServerNode } from '../types/server.js';
export class ServerPoolPlaceholder {
  constructor(private nodes: readonly ServerNode[] = []) {}
  size(): number { return this.nodes.length; }
  totalCapacity(): number { return this.nodes.reduce((n, s) => n + s.capacity, 0); }
}
