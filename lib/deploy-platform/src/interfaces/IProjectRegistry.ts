import type { ProjectRecord, ProjectSource } from '../types/project.js';
export interface IProjectRegistry {
  upsert(source: ProjectSource): ProjectRecord;
  get(id: string): ProjectRecord | undefined;
  list(): readonly ProjectRecord[];
  remove(id: string): boolean;
}
