/**
 * Phase 8 — Server Manager.
 *
 * Orchestrates a fleet of hosting nodes: registration, heartbeats,
 * health-based routing, capacity-aware placement. Implements the
 * existing `IServerManager` interface with an extended API for
 * heartbeat expiry and least-busy selection.
 */
import type { IServerManager } from '@workspace/deploy-platform/interfaces';
import type { ServerNode } from '@workspace/deploy-platform/types';

export interface ServerManagerOptions {
  readonly heartbeatTimeoutMs?: number;
  readonly clock?: () => number;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export class ServerManager implements IServerManager {
  private readonly nodes = new Map<string, Mutable<ServerNode> & { load: number }>();
  private rr = 0;
  private readonly heartbeatTimeoutMs: number;
  private readonly now: () => number;

  constructor(opts?: ServerManagerOptions) {
    this.heartbeatTimeoutMs = opts?.heartbeatTimeoutMs ?? 30_000;
    this.now = opts?.clock ?? Date.now;
  }

  register(node: Omit<ServerNode, 'lastHeartbeat' | 'status'>): ServerNode {
    const full: Mutable<ServerNode> & { load: number } = {
      id: node.id,
      region: node.region,
      capacity: node.capacity,
      tags: [...node.tags],
      status: 'unknown',
      lastHeartbeat: this.now(),
      load: 0,
    };
    this.nodes.set(node.id, full);
    return full;
  }
  deregister(id: string): boolean { return this.nodes.delete(id); }
  list(): readonly ServerNode[] { this.reap(); return Array.from(this.nodes.values()); }
  reportHeartbeat(id: string): void {
    const n = this.nodes.get(id); if (!n) return;
    n.lastHeartbeat = this.now();
    n.status = 'healthy';
  }
  reportLoad(id: string, load: number): void {
    const n = this.nodes.get(id); if (!n) return;
    n.load = Math.max(0, load);
    if (n.load / Math.max(1, n.capacity) > 0.9) n.status = 'degraded';
  }

  pick(strategy: 'round-robin' | 'least-busy' = 'round-robin'): ServerNode | undefined {
    this.reap();
    const alive = Array.from(this.nodes.values()).filter(n => n.status !== 'down');
    if (alive.length === 0) return undefined;
    if (strategy === 'least-busy') {
      return alive.slice().sort((a, b) => (a.load / a.capacity) - (b.load / b.capacity))[0];
    }
    return alive[this.rr++ % alive.length];
  }

  private reap(): void {
    const cutoff = this.now() - this.heartbeatTimeoutMs;
    for (const n of this.nodes.values()) {
      if (n.lastHeartbeat < cutoff && n.status !== 'down') n.status = 'down';
    }
  }
}
