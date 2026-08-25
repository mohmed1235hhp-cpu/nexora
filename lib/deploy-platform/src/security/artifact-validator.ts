import type { ArtifactMeta } from '../types/artifact.js';
export interface ArtifactValidation { readonly ok: boolean; readonly reason?: string; }
export class ArtifactValidator {
  private maxBytes: number;
  constructor(maxBytes = 200 * 1024 * 1024) { this.maxBytes = maxBytes; }
  validate(meta: ArtifactMeta): ArtifactValidation {
    if (meta.size > this.maxBytes) return { ok: false, reason: 'artifact too large' };
    if (!meta.checksum) return { ok: false, reason: 'missing checksum' };
    return { ok: true };
  }
}
