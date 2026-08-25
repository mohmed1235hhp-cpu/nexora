import type { BuildResult } from '../types/build.js';
export class BuildHistory {
  private results: BuildResult[] = [];
  add(result: BuildResult): void { this.results.push(result); }
  list(projectId?: string): readonly BuildResult[] {
    return projectId ? this.results.filter(r => r.projectId === projectId) : [...this.results];
  }
  get(buildId: string): BuildResult | undefined { return this.results.find(r => r.id === buildId); }
}
