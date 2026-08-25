import type { IHostingService } from '../interfaces/IHostingService.js';
import type { HostedProject } from '../types/hosting.js';
import { InternalUrlGenerator } from './internal-url-generator.js';

export class HostingService implements IHostingService {
  private hosted = new Map<string, HostedProject>();
  constructor(private urls = new InternalUrlGenerator()) {}
  async publish(input: { projectId: string; buildId: string; artifactIds: readonly string[] }): Promise<HostedProject> {
    const hp: HostedProject = {
      projectId: input.projectId, buildId: input.buildId,
      internalUrl: this.urls.urlFor(input.projectId, input.buildId),
      ssl: false, createdAt: Date.now(),
    };
    this.hosted.set(input.projectId, hp);
    return hp;
  }
  async unpublish(projectId: string): Promise<boolean> { return this.hosted.delete(projectId); }
  async get(projectId: string) { return this.hosted.get(projectId); }
  async list(): Promise<readonly HostedProject[]> { return [...this.hosted.values()]; }
}
