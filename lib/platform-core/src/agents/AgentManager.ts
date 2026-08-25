/**
 * Agent Manager — Phase 1.
 * Wraps @workspace/agents AgentRegistry with:
 *   - registration / discovery
 *   - loading / unloading
 *   - health checks
 *   - version control
 *   - permission scopes per agent
 *   - status monitoring
 *
 * Never invokes agents directly. Invocation goes through AIOrchestrator.
 */

export type AgentStatus = "loaded" | "unloaded" | "unhealthy" | "starting";

export interface AgentDescriptor {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly capabilities: readonly string[];
  readonly permissions: readonly string[];
  readonly backupAgentId?: string;
}

export interface IAgentAdapter {
  readonly id: string;
  readonly descriptor: AgentDescriptor;
  healthCheck(): Promise<boolean>;
  execute(taskInput: unknown, ctx: { sessionId: string; signal?: AbortSignal }): Promise<unknown>;
}

interface AgentEntry {
  adapter: IAgentAdapter;
  status: AgentStatus;
  lastHealthAt: number;
  lastHealthy: boolean;
}

export class AgentManager {
  private readonly entries = new Map<string, AgentEntry>();

  register(adapter: IAgentAdapter): void {
    if (this.entries.has(adapter.id)) {
      throw new Error(`agent ${adapter.id} already registered`);
    }
    this.entries.set(adapter.id, { adapter, status: "loaded", lastHealthAt: 0, lastHealthy: true });
  }

  unregister(id: string): boolean {
    const e = this.entries.get(id);
    if (!e) return false;
    e.status = "unloaded";
    return this.entries.delete(id);
  }

  load(id: string): void {
    const e = this.entries.get(id);
    if (e) e.status = "loaded";
  }
  unload(id: string): void {
    const e = this.entries.get(id);
    if (e) e.status = "unloaded";
  }

  discover(capability: string): readonly IAgentAdapter[] {
    return Array.from(this.entries.values())
      .filter((e) => e.status === "loaded" && e.adapter.descriptor.capabilities.includes(capability))
      .map((e) => e.adapter);
  }

  get(id: string): IAgentAdapter {
    const e = this.entries.get(id);
    if (!e) throw new Error(`agent ${id} not found`);
    return e.adapter;
  }

  tryGet(id: string): IAgentAdapter | undefined {
    return this.entries.get(id)?.adapter;
  }

  list(): readonly AgentDescriptor[] {
    return Array.from(this.entries.values()).map((e) => e.adapter.descriptor);
  }

  status(id: string): AgentStatus | undefined {
    return this.entries.get(id)?.status;
  }

  async healthCheck(id: string): Promise<boolean> {
    const e = this.entries.get(id);
    if (!e) return false;
    try {
      const ok = await e.adapter.healthCheck();
      e.lastHealthAt = Date.now();
      e.lastHealthy = ok;
      e.status = ok ? "loaded" : "unhealthy";
      return ok;
    } catch {
      e.lastHealthy = false;
      e.lastHealthAt = Date.now();
      e.status = "unhealthy";
      return false;
    }
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    const out: Record<string, boolean> = {};
    await Promise.all(
      Array.from(this.entries.keys()).map(async (id) => {
        out[id] = await this.healthCheck(id);
      }),
    );
    return out;
  }

  count(): number {
    return this.entries.size;
  }
}
