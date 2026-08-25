export class IncrementalBuildCache {
  private hashes = new Map<string, string>();
  shouldRebuild(projectId: string, contentHash: string): boolean {
    const prev = this.hashes.get(projectId);
    if (prev === contentHash) return false;
    this.hashes.set(projectId, contentHash);
    return true;
  }
}
