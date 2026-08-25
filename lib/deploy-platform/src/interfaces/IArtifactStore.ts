import type { ArtifactMeta } from '../types/artifact.js';
export interface IArtifactStore {
  put(input: { buildId: string; projectId: string; path: string; content: Uint8Array; contentType: string }): Promise<ArtifactMeta>;
  get(id: string): Promise<{ meta: ArtifactMeta; content: Uint8Array } | undefined>;
  list(filter?: { projectId?: string; buildId?: string }): Promise<readonly ArtifactMeta[]>;
  delete(id: string): Promise<boolean>;
}
