import type { AgentConfig } from "../types/config.types";
import { DEFAULT_AGENT_CONFIG } from "./defaults";

export class AgentConfigStore {
  private configs = new Map<string, AgentConfig>();

  set(id: string, config: Partial<AgentConfig>): void {
    this.configs.set(id, { id, ...DEFAULT_AGENT_CONFIG, ...config });
  }

  get(id: string): AgentConfig {
    return this.configs.get(id) ?? { id, ...DEFAULT_AGENT_CONFIG };
  }

  isEnabled(id: string): boolean {
    return this.get(id).enabled;
  }
}
