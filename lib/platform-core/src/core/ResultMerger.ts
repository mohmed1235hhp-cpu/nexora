/**
 * Merges TaskResult[] into a single PlatformResponse.
 * Produces one clean answer + artifacts + citations, hiding technical details.
 */
import type { Citation, PlatformArtifact, PlatformResponse, TaskResult } from "../types";
import { sanitizeOutput } from "../security/InputValidator";

export interface MergeInput {
  readonly requestId: string;
  readonly results: readonly TaskResult[];
  readonly citations?: readonly Citation[];
  readonly totalDurationMs: number;
}

export class ResultMerger {
  merge(input: MergeInput): PlatformResponse {
    const artifacts: PlatformArtifact[] = [];
    const texts: string[] = [];
    const warnings: string[] = [];
    const agents = new Set<string>();
    let tokens = 0;
    let ok = true;

    for (const r of input.results) {
      agents.add(r.agentId);
      if (!r.ok) {
        ok = false;
        warnings.push(`task ${r.taskId.split("::").pop()} degraded`);
        continue;
      }
      const out = r.output as { text?: string; artifacts?: PlatformArtifact[]; tokens?: number } | undefined;
      if (out?.text) texts.push(out.text);
      if (out?.tokens) tokens += out.tokens;
      if (Array.isArray(out?.artifacts)) artifacts.push(...out.artifacts);
    }

    const text = sanitizeOutput(texts.join("\n\n").trim() || "Done.");
    return {
      requestId: input.requestId,
      ok,
      text,
      artifacts,
      usage: {
        totalTokens: tokens,
        totalDurationMs: input.totalDurationMs,
        tasksExecuted: input.results.length,
        agentsInvolved: Array.from(agents),
      },
      citations: input.citations,
      warnings: warnings.length ? warnings : undefined,
    };
  }
}
