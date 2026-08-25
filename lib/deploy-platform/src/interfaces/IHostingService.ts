import type { HostedProject } from '../types/hosting.js';
export interface IHostingService {
  publish(input: { projectId: string; buildId: string; artifactIds: readonly string[] }): Promise<HostedProject>;
  unpublish(projectId: string): Promise<boolean>;
  get(projectId: string): Promise<HostedProject | undefined>;
  list(): Promise<readonly HostedProject[]>;
}
