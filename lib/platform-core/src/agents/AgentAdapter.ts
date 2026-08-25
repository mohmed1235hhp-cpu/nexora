/**
 * Adapter to wrap an existing @workspace/agents IAgent into an
 * IAgentAdapter usable by the Phase 1 AgentManager.
 *
 * This lets us reuse the 16 domain agents without modifying them.
 */
import type { IAgentAdapter, AgentDescriptor } from "./AgentManager";

// Structural types so we don't create a hard build-time dep on @workspace/agents.
export interface LegacyAgent {
  readonly id: string;
  readonly name?: string;
  readonly version?: string;
  readonly capabilities: readonly string[];
  execute?: (input: unknown, ctx: unknown) => Promise<unknown>;
  run?: (input: unknown, ctx: unknown) => Promise<unknown>;
}

export interface LegacyAgentAdapterOptions {
  readonly backupAgentId?: string;
  readonly permissions?: readonly string[];
  readonly healthCheck?: () => Promise<boolean>;
  readonly makeCtx?: (sessionId: string) => unknown;
}

export function adaptLegacyAgent(agent: LegacyAgent, opts: LegacyAgentAdapterOptions = {}): IAgentAdapter {
  const descriptor: AgentDescriptor = {
    id: agent.id,
    name: agent.name ?? agent.id,
    version: agent.version ?? "1.0.0",
    capabilities: agent.capabilities,
    permissions: opts.permissions ?? ["agent.invoke"],
    backupAgentId: opts.backupAgentId,
  };

  return {
    id: agent.id,
    descriptor,
    async healthCheck() {
      return opts.healthCheck ? opts.healthCheck() : true;
    },
    async execute(input, ctx) {
      const fn = agent.execute ?? agent.run;
      if (!fn) throw new Error(`agent ${agent.id} has no execute/run function`);
      const runtimeCtx = opts.makeCtx ? opts.makeCtx(ctx.sessionId) : ctx;
      return fn.call(agent, input, runtimeCtx);
    },
  };
}
