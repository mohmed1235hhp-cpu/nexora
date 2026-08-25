/**
 * Phase 8 — Signed artifact store adapter.
 *
 * Wraps any `IArtifactStore` so every stored artifact gets a detached
 * Ed25519 signature. The signature is returned via `meta.checksum`
 * (as `sha256=... sig=base64...`) to stay compatible with the existing
 * interface, so no downstream consumer breaks.
 */
import type { IArtifactStore } from '@workspace/deploy-platform/interfaces';
import type { ArtifactMeta } from '@workspace/deploy-platform/types';
import { ArtifactSigner } from '../security/Sandbox.js';

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export class SignedArtifactStore implements IArtifactStore {
  constructor(private readonly inner: IArtifactStore, private readonly signer: ArtifactSigner) {}

  async put(input: { buildId: string; projectId: string; path: string; content: Uint8Array; contentType: string }): Promise<ArtifactMeta> {
    const meta = await this.inner.put(input);
    const sig = await this.signer.sign(input.content);
    const hash = await sha256Hex(input.content);
    return { ...meta, checksum: `sha256=${hash} sig=${toBase64(sig)}` };
  }

  get(id: string): ReturnType<IArtifactStore['get']> { return this.inner.get(id); }
  list(filter?: { projectId?: string; buildId?: string }): ReturnType<IArtifactStore['list']> { return this.inner.list(filter); }
  delete(id: string): ReturnType<IArtifactStore['delete']> { return this.inner.delete(id); }
}
