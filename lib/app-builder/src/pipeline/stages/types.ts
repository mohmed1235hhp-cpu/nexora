import type { FileArtifact } from "../../ai/schemas/common";

/**
 * Shared pipeline-stage input contract.
 *
 * Previously each of the 6 stage files declared its own identical
 * `StageInput`, causing barrel `export *` collisions. Consolidated here
 * so the contract is defined once.
 */
export interface StageInput {
  blueprint?: unknown;
  files?: FileArtifact[];
}
