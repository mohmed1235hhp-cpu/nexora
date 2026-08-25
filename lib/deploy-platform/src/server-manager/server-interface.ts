import type { ServerNode } from '../types/server.js';
/** Contract Phase 2 implementations must satisfy. */
export interface IServerProvider {
  provision(spec: { region: string; capacity: number; tags?: readonly string[] }): Promise<ServerNode>;
  release(id: string): Promise<boolean>;
  describe(id: string): Promise<ServerNode | undefined>;
}
