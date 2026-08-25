import type { IPreviewService, PreviewHandle } from '../interfaces/IPreviewService.js';
import { PreviewRegistry } from './preview-registry.js';
import { InternalUrlGenerator } from '../hosting/internal-url-generator.js';

export class PreviewService implements IPreviewService {
  constructor(
    private registry = new PreviewRegistry(),
    private urls = new InternalUrlGenerator({ baseDomain: 'preview.internal.local' }),
    private ttlMs = 24 * 3600 * 1000,
  ) {}
  async create(input: { projectId: string; buildId: string; artifactIds: readonly string[] }): Promise<PreviewHandle> {
    const handle: PreviewHandle = {
      buildId: input.buildId,
      url: this.urls.urlFor(input.projectId, input.buildId),
      expiresAt: Date.now() + this.ttlMs,
    };
    this.registry.set(handle);
    return handle;
  }
  async get(buildId: string) { return this.registry.get(buildId); }
  async revoke(buildId: string): Promise<boolean> { return this.registry.delete(buildId); }
}
