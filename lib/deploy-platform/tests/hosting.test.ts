import { describe, it, expect } from 'vitest';
import { HostingService } from '../src/hosting/hosting-service.js';

describe('HostingService', () => {
  it('publishes and unpublishes a project', async () => {
    const svc = new HostingService();
    const hp = await svc.publish({ projectId: 'p1', buildId: 'b1', artifactIds: [] });
    expect(hp.internalUrl).toMatch(/p1--b1/);
    expect(await svc.get('p1')).toBeDefined();
    expect(await svc.unpublish('p1')).toBe(true);
    expect(await svc.get('p1')).toBeUndefined();
  });
});
