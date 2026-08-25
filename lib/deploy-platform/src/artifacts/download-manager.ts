import type { IArtifactStore } from '../interfaces/IArtifactStore.js';
export class ArtifactDownloadManager {
  constructor(private store: IArtifactStore) {}
  async fetch(id: string): Promise<Uint8Array | undefined> {
    const entry = await this.store.get(id);
    return entry?.content;
  }
}
