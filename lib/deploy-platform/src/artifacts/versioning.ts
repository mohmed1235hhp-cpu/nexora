import type { ArtifactMeta } from '../types/artifact.js';
export class ArtifactVersioning {
  latest(list: readonly ArtifactMeta[]): ArtifactMeta | undefined {
    return [...list].sort((a, b) => b.version - a.version)[0];
  }
  history(list: readonly ArtifactMeta[], path: string): readonly ArtifactMeta[] {
    return list.filter(a => a.path === path).sort((a, b) => a.version - b.version);
  }
}
