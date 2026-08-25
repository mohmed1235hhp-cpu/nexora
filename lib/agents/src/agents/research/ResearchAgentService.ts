import type { AIRouterLike } from "../../types/agent.types";

/**
 * Domain service for ResearchAgent.
 * Wraps @workspace/ai-core AIRouter for the specific task type.
 */
export class ResearchAgentService {
  constructor(private router: AIRouterLike) {}

  async run(input: unknown, meta?: Record<string, unknown>): Promise<{ ok: boolean; output?: unknown; error?: string }> {
    try {
      const request = {
        task: "text-chat",
        input,
        meta,
      };
      const response = await this.router.execute(request) as { ok: boolean; data?: unknown; errorMessage?: string };
      return { ok: response.ok, output: response.data, error: response.errorMessage };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }
}
