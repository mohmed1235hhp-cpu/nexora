import type { IArtifactStore } from '../interfaces/IArtifactStore.js';
import type { ArtifactMeta } from '../types/artifact.js';
import { newId } from '../utils/id.js';
import { createHash } from 'node:crypto';

export class InMemoryArtifactStore implements IArtifactStore {
  private artifacts = new Map<string, { meta: ArtifactMeta; content: Uint8Array }>();
  private versions = new Map<string, number>();

  async put(input: { buildId: string; projectId: string; path: string; content: Uint8Array; contentType: string }): Promise<ArtifactMeta> {
    const key = `${input.projectId}:${input.path}`;
    const version = (this.versions.get(key) ?? 0) + 1;
    this.versions.set(key, version);
    const meta: ArtifactMeta = {
      id: newId('art'),
      buildId: input.buildId, projectId: input.projectId, path: input.path,
      size: input.content.byteLength, contentType: input.contentType,
      version, checksum: createHash('sha256').update(input.content).digest('hex'),
      createdAt: Date.now(),
    };
    this.artifacts.set(meta.id, { meta, content: input.content });
    return meta;
  }
  async get(id: string) { return this.artifacts.get(id); }
  async list(filter?: { projectId?: string; buildId?: string }): Promise<readonly ArtifactMeta[]> {
    return [...this.artifacts.values()]
      .map(x => x.meta)
      .filter(m => !filter?.projectId || m.projectId === filter.projectId)
      .filter(m => !filter?.buildId || m.buildId === filter.buildId);
  }
  async delete(id: string): Promise<boolean> { return this.artifacts.delete(id); }
}
