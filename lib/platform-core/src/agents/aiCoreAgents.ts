/**
 * AI-Core-backed agents — the missing link that makes @workspace/platform-core
 * a REAL AI Orchestrator instead of an empty shell.
 *
 * PlatformBootstrap's AgentManager starts with zero agents registered — every
 * capability in TaskManager's INTENT_BLUEPRINTS (chat.reply, image.generate,
 * code.review, ...) had nothing to discover(). This file registers one
 * IAgentAdapter per capability that maps cleanly onto an existing
 * @workspace/ai-core TaskType, each `execute()` delegating to the same
 * Provider Manager (Claude/OpenAI/Groq/...) built in Phase 2 — so the
 * orchestrator's retry/circuit-breaker/backup-agent logic sits ON TOP OF
 * ai-core's own primary->secondary->fallback provider chains, not instead
 * of them.
 *
 * NOT every blueprint capability has an agent here yet — planning.plan,
 * architecture.design, design.ui, content.write, code.test, deploy.package,
 * deploy.deliver, and debug.diagnose have no clean 1:1 ai-core TaskType and
 * are intentionally left unregistered. AIOrchestrator already degrades
 * gracefully (a `no_agent` TaskResult, not a crash) when a capability has no
 * registered agent, so `app.build`/`website.build` plans will report a
 * partial result for those steps rather than pretending to complete them —
 * the dedicated /api/ai/app and /api/ai/website routes remain the complete
 * path for those two intents today.
 */
import type { IAgentAdapter, AgentDescriptor } from "./AgentManager";
import { getAIRouter, TaskType } from "@workspace/ai-core";

interface AgentSpec {
  id: string;
  capability: string;
  task: (typeof TaskType)[keyof typeof TaskType];
  backupAgentId?: string;
}

const AGENT_SPECS: AgentSpec[] = [
  { id: "ai-core.chat", capability: "chat.reply", task: TaskType.TextChat },
  { id: "ai-core.image", capability: "image.generate", task: TaskType.ImageGeneration },
  { id: "ai-core.vision", capability: "image.analyze", task: TaskType.ImageAnalysis },
  { id: "ai-core.voice", capability: "voice.synthesize", task: TaskType.TextToSpeech },
  { id: "ai-core.code-review", capability: "code.review", task: TaskType.CodeReview },
  { id: "ai-core.code-generate", capability: "code.generate", task: TaskType.ApplicationGeneration },
  { id: "ai-core.document", capability: "document.parse", task: TaskType.DocumentAnalysis },
  { id: "ai-core.search", capability: "search.web", task: TaskType.InternetSearch },
  { id: "ai-core.research", capability: "research.summarize", task: TaskType.GeneralAI },
];

function makeAdapter(spec: AgentSpec): IAgentAdapter {
  const descriptor: AgentDescriptor = {
    id: spec.id,
    name: spec.id,
    version: "1.0.0",
    capabilities: [spec.capability],
    permissions: ["agent.invoke"],
    backupAgentId: spec.backupAgentId,
  };

  return {
    id: spec.id,
    descriptor,
    async healthCheck() {
      // Delegate to ai-core's own provider health for this capability —
      // the agent is only as healthy as its underlying provider chain.
      const chain = getAIRouter().providers.resolveAll(spec.task);
      if (chain.length === 0) return false;
      const results = await Promise.all(chain.slice(0, 1).map((p) => p.healthCheck()));
      return results.some((h) => h.healthy);
    },
    async execute(input, ctx) {
      const result = await getAIRouter().execute({
        task: spec.task,
        input,
        meta: { sessionId: ctx.sessionId, requestId: undefined },
      });
      if (!result.ok) {
        throw new Error(result.errorMessage ?? `${spec.id} failed`);
      }
      return result.data;
    },
  };
}

/** Registers every ai-core-backed agent on the given AgentManager. Idempotent per manager instance. */
export function registerAiCoreAgents(agentManager: { register(a: IAgentAdapter): void }): void {
  for (const spec of AGENT_SPECS) {
    agentManager.register(makeAdapter(spec));
  }
}

export const AI_CORE_AGENT_CAPABILITIES = AGENT_SPECS.map((s) => s.capability);
