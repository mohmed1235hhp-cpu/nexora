import type { HostedProject } from '../types/hosting.js';
export class DeploymentHistory {
  private entries: HostedProject[] = [];
  add(hp: HostedProject): void { this.entries.push(hp); }
  list(projectId?: string): readonly HostedProject[] {
    return projectId ? this.entries.filter(e => e.projectId === projectId) : [...this.entries];
  }
}
