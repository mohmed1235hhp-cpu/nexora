export interface Artifact {
  id: string;
  data: unknown;
  createdBy?: string;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export class ArtifactStore {
  private items = new Map<string, Artifact>();

  store(id: string, data: unknown, createdBy?: string, metadata?: Record<string, unknown>): void {
    this.items.set(id, { id, data, createdBy, createdAt: Date.now(), metadata });
  }

  retrieve(id: string): unknown | undefined {
    return this.items.get(id)?.data;
  }

  getArtifact(id: string): Artifact | undefined {
    return this.items.get(id);
  }

  list(): Artifact[] {
    return Array.from(this.items.values());
  }

  remove(id: string): boolean {
    return this.items.delete(id);
  }
}
