import type { AgentCapability } from "../types/agent.types";

export class CapabilityRegistry {
  private map = new Map<AgentCapability, string[]>();

  register(capability: AgentCapability, agentId: string): void {
    const list = this.map.get(capability) ?? [];
    if (!list.includes(agentId)) list.push(agentId);
    this.map.set(capability, list);
  }

  unregister(agentId: string): void {
    for (const [cap, agents] of this.map.entries()) {
      this.map.set(cap, agents.filter(id => id !== agentId));
    }
  }

  getAgents(capability: AgentCapability): string[] {
    return this.map.get(capability) ?? [];
  }

  getBestAgent(capability: AgentCapability): string | undefined {
    return this.getAgents(capability)[0];
  }

  hasCapability(capability: AgentCapability): boolean {
    return (this.map.get(capability)?.length ?? 0) > 0;
  }
}
