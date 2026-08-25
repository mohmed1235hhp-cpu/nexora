import type { IAgent, AgentDescriptor } from "../types/agent.types";
import { AgentError, AgentErrorCode } from "../core/AgentErrors";

export class AgentRegistry {
  private agents = new Map<string, IAgent>();
  private descriptors = new Map<string, AgentDescriptor>();

  register(agent: IAgent, descriptor: AgentDescriptor): void {
    this.agents.set(agent.id, agent);
    this.descriptors.set(agent.id, descriptor);
  }

  unregister(id: string): boolean {
    this.descriptors.delete(id);
    return this.agents.delete(id);
  }

  get(id: string): IAgent {
    const agent = this.agents.get(id);
    if (!agent) throw new AgentError(AgentErrorCode.NotFound, `Agent ${id} not found`);
    return agent;
  }

  tryGet(id: string): IAgent | undefined {
    return this.agents.get(id);
  }

  getDescriptor(id: string): AgentDescriptor | undefined {
    return this.descriptors.get(id);
  }

  getAll(): IAgent[] {
    return Array.from(this.agents.values());
  }

  getAllDescriptors(): AgentDescriptor[] {
    return Array.from(this.descriptors.values());
  }

  has(id: string): boolean {
    return this.agents.has(id);
  }

  count(): number {
    return this.agents.size;
  }
}
