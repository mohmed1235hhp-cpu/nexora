import type { AgentContext } from "../agents/BaseAgent";
import type { FileArtifact } from "../ai/schemas/common";

/**
 * Shared generator I/O types.
 *
 * Every generator under `src/generators/**` accepts a `GenerateInput` and
 * returns a `GenerateResult`. These interfaces were previously duplicated
 * across ~27 generator files; they are hoisted here so barrel `export *`
 * statements no longer produce ambiguous re-exports, and so the contract
 * is defined in exactly one place.
 */
export interface GenerateInput {
  ctx: AgentContext;
  spec: Record<string, unknown>;
}

export interface GenerateResult {
  generator: string;
  files: FileArtifact[];
  warnings: string[];
}
