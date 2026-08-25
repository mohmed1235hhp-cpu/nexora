import type { IProjectRegistry } from '../interfaces/IProjectRegistry.js';
import type { ProjectRecord, ProjectSource } from '../types/project.js';

export class InMemoryProjectRegistry implements IProjectRegistry {
  private store = new Map<string, ProjectRecord>();
  upsert(source: ProjectSource): ProjectRecord {
    const now = Date.now();
    const prev = this.store.get(source.id);
    const record: ProjectRecord = { ...source, createdAt: prev?.createdAt ?? now, updatedAt: now };
    this.store.set(source.id, record);
    return record;
  }
  get(id: string) { return this.store.get(id); }
  list(): readonly ProjectRecord[] { return [...this.store.values()]; }
  remove(id: string): boolean { return this.store.delete(id); }
}
