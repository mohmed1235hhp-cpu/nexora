import type { ServerNode } from '../types/server.js';
export class LoadBalancerPlaceholder {
  private idx = 0;
  route(nodes: readonly ServerNode[]): ServerNode | undefined {
    if (nodes.length === 0) return undefined;
    const node = nodes[this.idx % nodes.length];
    this.idx += 1;
    return node;
  }
}
