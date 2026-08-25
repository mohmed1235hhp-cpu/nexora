import type { IServerManager } from '../interfaces/IServerManager.js';
import type { ServerNode } from '../types/server.js';
import { newId } from '../utils/id.js';

/**
 * Placeholder registry — never contacts a real server.
 * Phase 2 will replace with a real IServerProvider binding.
 */
export class ServerRegistryPlaceholder implements IServerManager {
  private nodes = new Map<string, ServerNode>();
  private rr = 0;
  register(node: Omit<ServerNode, 'lastHeartbeat' | 'status'>): ServerNode {
    const id = node.id || newId('srv');
    const full: ServerNode = { ...node, id, status: 'unknown', lastHeartbeat: 0 };
    this.nodes.set(id, full);
    return full;
  }
  deregister(id: string): boolean { return this.nodes.delete(id); }
  list(): readonly ServerNode[] { return [...this.nodes.values()]; }
  pick(strategy: 'round-robin' | 'least-busy' = 'round-robin'): ServerNode | undefined {
    const nodes = this.list();
    if (nodes.length === 0) return undefined;
    if (strategy === 'least-busy') return [...nodes].sort((a, b) => a.capacity - b.capacity)[0];
    const node = nodes[this.rr % nodes.length];
    this.rr += 1;
    return node;
  }
  reportHeartbeat(id: string): void {
    const n = this.nodes.get(id);
    if (n) this.nodes.set(id, { ...n, status: 'healthy', lastHeartbeat: Date.now() });
  }
}
