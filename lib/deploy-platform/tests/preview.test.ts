import { describe, it, expect } from 'vitest';
import { PreviewService } from '../src/preview/preview-service.js';

describe('PreviewService', () => {
  it('creates and revokes preview handles', async () => {
    const svc = new PreviewService();
    const h = await svc.create({ projectId: 'p1', buildId: 'b1', artifactIds: [] });
    expect(h.url).toContain('p1--b1');
    expect((await svc.get('b1'))?.buildId).toBe('b1');
    expect(await svc.revoke('b1')).toBe(true);
  });
});
