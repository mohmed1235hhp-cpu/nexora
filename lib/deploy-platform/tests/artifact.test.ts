import { describe, it, expect } from 'vitest';
import { InMemoryArtifactStore } from '../src/artifacts/artifact-store.js';
import { ArtifactVersioning } from '../src/artifacts/versioning.js';

describe('Artifact store', () => {
  it('versions artifacts per path and computes a checksum', async () => {
    const store = new InMemoryArtifactStore();
    const versioning = new ArtifactVersioning();
    const a = await store.put({ buildId: 'b1', projectId: 'p1', path: 'index.html', content: new TextEncoder().encode('<a>'), contentType: 'text/html' });
    const b = await store.put({ buildId: 'b2', projectId: 'p1', path: 'index.html', content: new TextEncoder().encode('<b>'), contentType: 'text/html' });
    expect(b.version).toBe(2);
    expect(a.checksum).not.toBe(b.checksum);
    const list = await store.list({ projectId: 'p1' });
    expect(versioning.latest(list)?.id).toBe(b.id);
  });
});
