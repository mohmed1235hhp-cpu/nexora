import type { IArtifactStore } from '../interfaces/IArtifactStore.js';
export class ArtifactCleanupManager {
  constructor(private store: IArtifactStore, private ttlMs = 7 * 24 * 3600 * 1000) {}
  async sweep(): Promise<number> {
    const now = Date.now();
    const all = await this.store.list();
    let removed = 0;
    for (const meta of all) {
      if (now - meta.createdAt > this.ttlMs) {
        if (await this.store.delete(meta.id)) removed += 1;
      }
    }
    return removed;
  }
}
