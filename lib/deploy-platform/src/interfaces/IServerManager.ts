import type { ServerNode } from '../types/server.js';
export interface IServerManager {
  register(node: Omit<ServerNode, 'lastHeartbeat' | 'status'>): ServerNode;
  deregister(id: string): boolean;
  list(): readonly ServerNode[];
  pick(strategy?: 'round-robin' | 'least-busy'): ServerNode | undefined;
  reportHeartbeat(id: string): void;
}
